/**
 * Email Parsing API Route
 * 
 * Parses job alert emails using Claude AI to extract job information
 * and creates job records in the database.
 */
import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { getUnparsedEmails, markEmailAsParsed } from '@/lib/data/emails-store';
import { addJob } from '@/lib/data/jobs-store';

/**
 * POST /api/emails/parse
 * 
 * Parses unparsed emails and extracts job information using Claude AI.
 * Can parse a specific email or all unparsed emails.
 * 
 * @param emailId - Optional email ID to parse a specific email
 * @returns JSON response with success status and number of jobs created
 */
export async function POST(request: NextRequest) {
  try {
    const { emailId } = await request.json();

    // Get emails to parse
    const emailsToParse = emailId 
      ? [(await import('@/lib/data/emails-store')).getEmails().then(data => data.emails.find(e => e.id === emailId))]
      : await getUnparsedEmails();

    const emails = await Promise.all(emailsToParse);
    const validEmails = emails.filter(Boolean);

    if (validEmails.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No unparsed emails found',
        jobsCreated: 0,
      });
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        {
          success: false,
          error: 'Claude API not configured',
          details: 'ANTHROPIC_API_KEY is missing. Set it in .env.local'
        },
        { status: 400 }
      );
    }

    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    const createdJobs = [];

    for (const email of validEmails) {
      if (!email) continue;

      try {
        // Extract job URL from HTML or text body
        const jobUrl = extractJobUrl(email.htmlBody || email.textBody);

        // Use Claude to extract job details
        const emailContent = `Subject: ${email.subject}\n\n${email.textBody.substring(0, 3000)}`;

        const message = await anthropic.messages.create({
          model: 'claude-3-haiku-20240307',
          max_tokens: 1024,
          messages: [
            {
              role: 'user',
              content: `Extract all job titles and company names from this LinkedIn job alert email. The email may contain multiple job listings. Return ONLY valid JSON with no other text.

Format: [{"jobTitle": "exact job title", "company": "exact company name"}, ...]

If there's only one job, still return an array with one object.

Email:
${emailContent}`,
            },
          ],
        });

        const content = message.content[0];
        const jobsData: Array<{ jobTitle: string; company: string }> = [];

        if (content.type === 'text') {
          const responseText = content.text.trim();
          console.log('Claude response:', responseText);

          // First, try to parse as a JSON array
          const arrayMatch = responseText.match(/\[[\s\S]*\]/);
          if (arrayMatch) {
            try {
              const parsed = JSON.parse(arrayMatch[0]);
              if (Array.isArray(parsed)) {
                jobsData.push(...parsed);
                console.log(`Successfully parsed ${parsed.length} jobs from array format`);
              }
            } catch (e) {
              console.log('Failed to parse as JSON array, trying individual objects...');
            }
          }

          // If array parsing didn't work, try parsing individual JSON objects
          if (jobsData.length === 0) {
            // Split by newlines and try to find complete JSON objects
            // Handle cases where Claude returns multiple objects on separate lines
            const lines = responseText.split('\n');
            let currentObj = '';
            let braceCount = 0;

            for (const line of lines) {
              const trimmedLine = line.trim();
              if (!trimmedLine) continue;

              currentObj += trimmedLine;
              
              // Count braces to detect complete objects
              for (const char of trimmedLine) {
                if (char === '{') braceCount++;
                if (char === '}') braceCount--;
              }

              // When braces are balanced, try to parse the accumulated object
              if (braceCount === 0 && currentObj.includes('{')) {
                try {
                  const parsed = JSON.parse(currentObj);
                  if (parsed.jobTitle && parsed.company) {
                    jobsData.push(parsed);
                    console.log(`Parsed job: ${parsed.jobTitle} at ${parsed.company}`);
                  }
                  currentObj = '';
                } catch (err) {
                  // Not a valid JSON object yet, continue accumulating
                  currentObj = '';
                }
              }
            }

            // Final fallback: try original regex approach for any remaining content
            if (jobsData.length === 0) {
              const objectMatches = responseText.match(/\{[^{}]*"jobTitle"[^{}]*"company"[^{}]*\}/g);
              if (objectMatches) {
                console.log(`Found ${objectMatches.length} individual job objects via regex`);
                for (const objStr of objectMatches) {
                  try {
                    const parsed = JSON.parse(objStr);
                    if (parsed.jobTitle || parsed.company) {
                      jobsData.push(parsed);
                    }
                  } catch (err) {
                    console.log('Failed to parse individual object:', objStr);
                  }
                }
              }
            }
          }

          if (jobsData.length > 0) {
            console.log(`Total jobs extracted: ${jobsData.length}`);
          } else {
            console.log('Failed to parse Claude response:', responseText);
          }
        }

        // If no jobs found via Claude, create one with fallback extraction
        if (jobsData.length === 0) {
          console.log(`No jobs parsed from email ${email.id}, using fallback extraction`);
          jobsData.push({
            jobTitle: extractJobTitleFromSubject(email.subject),
            company: 'Unknown Company'
          });
        }

        // Create a job for each extracted job listing
        console.log(`Creating ${jobsData.length} job(s) from email ${email.id}`);
        for (const jobData of jobsData) {
          const job = await addJob({
            emailDate: email.date,
            jobName: jobData.jobTitle || extractJobTitleFromSubject(email.subject),
            company: jobData.company || 'Unknown Company',
            jobUrl: jobUrl,
            criteriaMatch: false, // User will fill this
            followupDescription: '', // User will fill this
          });

          createdJobs.push(job);
          console.log(`  ✓ Created job ${job.id}: "${jobData.jobTitle}" at ${jobData.company}`);
        }

        // Mark email as parsed
        await markEmailAsParsed(email.id);
        console.log(`Email ${email.id} marked as parsed`);
      } catch (error) {
        console.error(`Error parsing email ${email.id}:`, error);
        // Continue with next email
      }
    }

    return NextResponse.json({
      success: true,
      emailsParsed: validEmails.length,
      jobsCreated: createdJobs.length,
      jobs: createdJobs,
    });
  } catch (error: any) {
    console.error('Email parsing error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to parse emails',
        details: error.message || '',
      },
      { status: 500 }
    );
  }
}

function extractJobUrl(content: string): string {
  if (!content) return '';

  // Decode HTML entities
  const decoded = content
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');

  // Look for LinkedIn job URLs
  const urlPattern = /https:\/\/[^\s"'<>]+linkedin\.com[^\s"'<>]*\/jobs\/view\/\d+[^\s"'<>]*/gi;
  const matches = decoded.match(urlPattern);

  if (matches && matches.length > 0) {
    // Clean the URL
    const url = matches[0];
    const cleanMatch = url.match(/(https:\/\/[^\/\s]+(?:\/comm)?\/jobs\/view\/\d+)/i);
    if (cleanMatch) {
      return cleanMatch[1] + '/';
    }
    return url.split(/[?#]/)[0]; // Remove query params
  }

  return '';
}

function extractJobTitleFromSubject(subject: string): string {
  // Try to extract job title from common email patterns
  const patterns = [
    /Job recommendation[:\s]+(.+?)(?:\s+at\s+|\s*$)/i,
    /(?:position|opportunity)[:\s]+(.+?)(?:\s+at\s+|\s*$)/i,
    /Recommended for you[:\s]+(.+?)(?:\s+at\s+|\s*$)/i,
    /"([^"]+)":/i, // Quoted job alert name
  ];

  for (const pattern of patterns) {
    const match = subject.match(pattern);
    if (match) {
      return match[1].trim();
    }
  }

  return subject.replace(/^(Re:|Fwd:|Job recommendation:?)/i, '').trim();
}
