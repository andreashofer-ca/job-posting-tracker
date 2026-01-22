import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { addJob, updateLastSync } from '@/lib/data/jobs-store';
import { searchGmail, buildSearchCriteria } from '@/lib/gmail/imap-client';

export async function POST(request: NextRequest) {
  try {
    const { dateFrom, dateTo, unreadOnly } = await request.json();

    // Check if Gmail credentials are configured
    if (!process.env.GMAIL_EMAIL || !process.env.GMAIL_APP_PASSWORD) {
      console.warn('Gmail credentials not configured');
      return NextResponse.json(
        {
          success: false,
          error: 'Gmail not configured',
          details: 'Gmail credentials are missing. Please configure:',
          instructions: [
            '1. Follow the setup at: SIMPLE_GMAIL_SETUP.md',
            '2. Set GMAIL_EMAIL in .env.local (your Gmail address)',
            '3. Set GMAIL_APP_PASSWORD in .env.local (16-character app password)',
            '4. Restart the dev server'
          ],
          credentials_found: {
            gmail_email: !!process.env.GMAIL_EMAIL,
            gmail_app_password: !!process.env.GMAIL_APP_PASSWORD
          }
        },
        { status: 400 }
      );
    }

    // Build IMAP search criteria
    const searchParams: any = {
      from: 'linkedin.com',
    };

    if (dateFrom) {
      searchParams.since = new Date(dateFrom);
    } else {
      // Default to last 3 days to avoid overwhelming searches
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      searchParams.since = threeDaysAgo;
    }

    if (dateTo) {
      searchParams.before = new Date(dateTo);
    }

    if (unreadOnly) {
      searchParams.unseen = true;
    }

    const criteria = buildSearchCriteria(searchParams);

    // Search Gmail via IMAP (limit to 20 most recent emails)
    console.log('Searching Gmail with criteria:', criteria);
    const emails = await searchGmail(criteria, 20);
    console.log(`Found ${emails.length} emails`);

    // Extract job entries using Claude
    const createdJobs = [];

    for (const email of emails) {
      // Check if email subject or body contains job-related keywords
      const isJobEmail =
        /job|position|opportunity|career|hiring|recommended/i.test(email.subject) ||
        /job|position|opportunity/i.test(email.body);

      if (!isJobEmail) continue;

      // Use Claude to summarize and extract job URL
      const summary = await summarizeEmail(email.subject, email.body, email.html);
      const jobUrl = summary.jobUrl || 'https://www.linkedin.com';

      const job = await addJob({
        emailDate: email.date,
        jobName: summary.jobTitle || extractJobTitleFromSubject(email.subject),
        company: summary.company || 'Unknown Company',
        jobUrl: jobUrl,
        criteriaMatch: false, // User will fill this
        followupDescription: '', // User will fill this
        summary: summary.summary,
        emailSubject: email.subject,
        emailId: email.id,
      });
      createdJobs.push(job);
    }

    await updateLastSync();

    return NextResponse.json({
      success: true,
      emailsFound: emails.length,
      jobsFound: createdJobs.length,
      jobs: createdJobs,
    });
  } catch (error: any) {
    console.error('Gmail search error:', error);

    // Provide specific error messages for common issues
    let errorMessage = 'Failed to search Gmail';
    let details = error.message || '';
    let suggestions: string[] = [];

    if (error.message?.includes('Invalid credentials') || error.code === 'EBADFAMILY') {
      errorMessage = 'Gmail authentication failed';
      suggestions = [
        'Verify your Gmail email and app password in .env.local',
        'Make sure you\'re using an app password, not your Gmail password',
        'Check that 2-Factor Authentication is enabled on your Google account',
        'Generate a new app password from https://myaccount.google.com/apppasswords'
      ];
    } else if (error.message?.includes('ENOTFOUND') || error.message?.includes('ECONNREFUSED')) {
      errorMessage = 'Cannot connect to Gmail servers';
      suggestions = [
        'Check your internet connection',
        'Gmail IMAP servers might be temporarily unavailable',
        'Try again in a few moments'
      ];
    } else if (error.message?.includes('timeout')) {
      errorMessage = 'Gmail search took too long';
      suggestions = [
        'Try searching with a narrower date range',
        'Try searching with "Unread only" enabled',
        'Gmail servers might be slow, please try again later'
      ];
    }

    return NextResponse.json(
      { 
        success: false,
        error: errorMessage, 
        details,
        suggestions
      },
      { status: 500 }
    );
  }
}

function extractJobTitleFromSubject(subject: string): string {
  // Try to extract job title from common email patterns
  const patterns = [
    /Job recommendation[:\s]+(.+?)(?:\s+at\s+|\s*$)/i,
    /(?:position|opportunity)[:\s]+(.+?)(?:\s+at\s+|\s*$)/i,
    /Recommended for you[:\s]+(.+?)(?:\s+at\s+|\s*$)/i,
  ];

  for (const pattern of patterns) {
    const match = subject.match(pattern);
    if (match) {
      return match[1].trim();
    }
  }

  return subject.replace(/^(Re:|Fwd:|Job recommendation:?)/i, '').trim();
}

async function summarizeEmail(subject: string, emailBody: string, htmlBody?: string): Promise<{
  jobTitle: string;
  company: string;
  summary: string;
  jobUrl?: string;
}> {
  try {
    // First, try to extract URLs from HTML if available
    if (htmlBody) {
      // Look for job view links first (highest priority)
      let jobViewUrl = null;
      
      // Extract all URLs from HTML
      const allUrls = htmlBody.match(/https:\/\/[^\s"'<>]+/g) || [];
      
      // Filter for LinkedIn job URLs
      const jobUrls = allUrls.filter(url => {
        return (url.includes('linkedin.com/jobs/view/') || 
                url.includes('linkedin.com/comm/jobs/view/') ||
                (url.includes('linkedin.com') && (url.includes('jobid=') || url.includes('job='))));
      });
      
      if (jobUrls.length > 0) {
        jobViewUrl = jobUrls[0];
        console.log('Found job view URL in HTML:', jobViewUrl);
        return {
          jobTitle: extractJobTitleFromSubject(subject),
          company: 'Company',
          summary: emailBody.substring(0, 200),
          jobUrl: jobViewUrl,
        };
      }
      
      // If no job-specific URL, look for any LinkedIn URL that looks like a job posting
      const linkedinUrls = allUrls.filter(url => url.includes('linkedin.com'));
      if (linkedinUrls.length > 0) {
        // Prioritize URLs with "view" or "job" in them
        const viewUrls = linkedinUrls.filter(url => url.includes('view') || url.includes('job'));
        jobViewUrl = viewUrls.length > 0 ? viewUrls[0] : linkedinUrls[0];
        console.log('Found LinkedIn URL in HTML:', jobViewUrl);
        return {
          jobTitle: extractJobTitleFromSubject(subject),
          company: 'Company',
          summary: emailBody.substring(0, 200),
          jobUrl: jobViewUrl,
        };
      }
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      // Fallback: use regex only
      const urlRegex = /https:\/\/(?:www\.)?linkedin\.com\/jobs\/view\/\d+/gi;
      const urls = emailBody.match(urlRegex) || [];
      return {
        jobTitle: extractJobTitleFromSubject(subject),
        company: 'Company',
        summary: emailBody.substring(0, 200),
        jobUrl: urls[0],
      };
    }

    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    const emailContent = `Subject: ${subject}\n\n${emailBody.substring(0, 3000)}`;

    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: `Extract job information from this LinkedIn job alert email. CRITICAL: You MUST find the job URL.

Look for these URL patterns:
1. https://www.linkedin.com/jobs/view/[numbers]
2. https://www.linkedin.com/comm/jobs/view/[numbers]
3. Any hyperlink that says "View job" or "Apply"
4. Any URL containing /jobs/view/ or /jobs/

Extract and return ONLY this JSON (no other text):
{"jobTitle": "job title here", "company": "company name", "summary": "brief summary", "jobUrl": "full URL here or null"}

Email content:
${emailContent}`,
        },
      ],
    });

    const content = message.content[0];
    if (content.type === 'text') {
      console.log('Claude response:', content.text.substring(0, 200));
      // Extract JSON from the response
      const jsonMatch = content.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        let parsed = JSON.parse(jsonMatch[0]);
        console.log('Parsed job URL from Claude:', parsed.jobUrl);
        
        // If Claude didn't find a URL, try multiple regex patterns
        if (!parsed.jobUrl) {
          // Try to find job view URLs
          const urlPatterns = [
            /https:\/\/(?:www\.)?linkedin\.com\/jobs\/view\/(\d+)/i,
            /https:\/\/(?:www\.)?linkedin\.com\/comm\/jobs\/view\/(\d+)/i,
            /https:\/\/[^\s]*linkedin\.com[^\s]*\/jobs[^\s]*/i,
            /https:\/\/[^\s]*linkedin\.com[^\s]*\/view[^\s]*/i,
          ];
          
          for (const pattern of urlPatterns) {
            const match = emailBody.match(pattern);
            if (match) {
              parsed.jobUrl = match[0] || `https://www.linkedin.com/jobs/view/${match[1]}`;
              console.log('Found URL via regex pattern:', parsed.jobUrl);
              break;
            }
          }
          
          // If still no URL found, try to extract from any https link in the body
          if (!parsed.jobUrl) {
            const allUrls = emailBody.match(/https:\/\/[^\s)]+/gi) || [];
            const linkedinUrl = allUrls.find(url => url.includes('linkedin.com'));
            if (linkedinUrl) {
              parsed.jobUrl = linkedinUrl.replace(/[),]+$/, ''); // Clean up trailing chars
              console.log('Found LinkedIn URL via general extraction:', parsed.jobUrl);
            }
          }
        }
        
        return {
          jobTitle: parsed.jobTitle || extractJobTitleFromSubject(subject),
          company: parsed.company || 'Company',
          summary: parsed.summary || emailBody.substring(0, 200),
          jobUrl: parsed.jobUrl,
        };
      }
    }

    return {
      jobTitle: extractJobTitleFromSubject(subject),
      company: 'Company',
      summary: emailBody.substring(0, 200),
    };
  } catch (error) {
    console.error('Summarization error:', error);
    return {
      jobTitle: extractJobTitleFromSubject(subject),
      company: 'Company',
      summary: emailBody.substring(0, 200),
    };
  }
}
