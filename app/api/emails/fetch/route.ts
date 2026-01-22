/**
 * Email Fetching API Route
 * 
 * Fetches job alert emails from Gmail using IMAP and stores them
 * in the local database for later parsing.
 */
import { NextRequest, NextResponse } from 'next/server';
import { addEmail, updateLastFetch } from '@/lib/data/emails-store';
import { searchGmail, buildSearchCriteria } from '@/lib/gmail/imap-client';

/**
 * POST /api/emails/fetch
 * 
 * Fetches LinkedIn job alert emails from Gmail inbox via IMAP.
 * 
 * @param dateFrom - Optional start date for email search
 * @param dateTo - Optional end date for email search
 * @param unreadOnly - Whether to fetch only unread emails
 * @returns JSON response with fetched emails count
 */
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

    // Get job alert senders from environment
    const jobAlertSenders = (process.env.JOB_ALERT_SENDERS || 'jobalerts-noreply@linkedin.com')
      .split(',')
      .map(sender => sender.trim());

    // Build IMAP search criteria for each sender
    const allEmails = [];
    
    for (const sender of jobAlertSenders) {
      const searchParams: any = {
        from: sender,
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

      // Search Gmail via IMAP (limit to 20 most recent emails per sender)
      console.log(`Searching Gmail for sender: ${sender} with criteria:`, criteria);
      const emails = await searchGmail(criteria, 20);
      console.log(`Found ${emails.length} emails from ${sender}`);
      allEmails.push(...emails);
    }

    // Remove duplicates (in case a user has multiple senders)
    const uniqueEmails = Array.from(new Map(allEmails.map(e => [e.id, e])).values());
    console.log(`Total unique emails after dedup: ${uniqueEmails.length}`);

    // Save emails to database
    const savedEmails = [];
    for (const email of uniqueEmails) {
      // Check if email subject or body contains job-related keywords
      const isJobEmail =
        /job|position|opportunity|career|hiring|recommended/i.test(email.subject) ||
        /job|position|opportunity/i.test(email.body);

      if (!isJobEmail) continue;

      const savedEmail = await addEmail({
        messageId: email.id,
        subject: email.subject,
        date: email.date,
        htmlBody: email.html || '',
        textBody: email.body,
        from: email.from,
        parsed: false,
      });

      savedEmails.push(savedEmail);
    }

    await updateLastFetch();

    return NextResponse.json({
      success: true,
      emailsFound: uniqueEmails.length,
      emailsSaved: savedEmails.length,
      emails: savedEmails,
    });
  } catch (error: any) {
    console.error('Gmail fetch error:', error);

    // Provide specific error messages for common issues
    let errorMessage = 'Failed to fetch emails from Gmail';
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
