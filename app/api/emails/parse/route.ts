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
              content: `Extract the job title and company name from this LinkedIn job alert email. Return ONLY valid JSON with no other text.

Format: {"jobTitle": "exact job title", "company": "exact company name"}

Email:
${emailContent}`,
            },
          ],
        });

        const content = message.content[0];
        let jobTitle = '';
        let company = '';

        if (content.type === 'text') {
          const jsonMatch = content.text.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            try {
              const parsed = JSON.parse(jsonMatch[0]);
              jobTitle = parsed.jobTitle || '';
              company = parsed.company || '';
            } catch (e) {
              console.log('Failed to parse Claude response:', jsonMatch[0]);
            }
          }
        }

        // Create job with simplified fields
        const job = await addJob({
          emailDate: email.date,
          jobName: jobTitle || extractJobTitleFromSubject(email.subject),
          company: company || 'Unknown Company',
          jobUrl: jobUrl,
          criteriaMatch: false, // User will fill this
          followupDescription: '', // User will fill this
        });

        createdJobs.push(job);

        // Mark email as parsed
        await markEmailAsParsed(email.id);

        console.log(`Parsed email ${email.id} into job ${job.id}`);
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
