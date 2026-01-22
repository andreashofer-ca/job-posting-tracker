import Imap from 'imap';
import { simpleParser } from 'mailparser';
import { Readable } from 'stream';

interface EmailMessage {
  id: string;
  subject: string;
  date: string;
  body: string;
  html?: string;
  from: string;
}

export async function searchGmail(
  searchCriteria: any[] = ['FROM', 'linkedin.com'],
  maxResults: number = 50
): Promise<EmailMessage[]> {
  return new Promise((resolve, reject) => {
    console.log('Starting Gmail IMAP search...');
    
    // Add timeout to prevent hanging (2 minutes for large mailboxes)
    const timeout = setTimeout(() => {
      console.error('Gmail search timed out after 2 minutes');
      imap.end();
      reject(new Error('Gmail search took too long. Try limiting the date range to search fewer emails.'));
    }, 120000);

    const imap = new Imap({
      user: process.env.GMAIL_EMAIL!,
      password: process.env.GMAIL_APP_PASSWORD!,
      host: 'imap.gmail.com',
      port: 993,
      tls: true,
      tlsOptions: { rejectUnauthorized: false },
      connTimeout: 10000,
      authTimeout: 10000,
    });

    const emails: EmailMessage[] = [];

    imap.once('ready', () => {
      console.log('IMAP connection ready, opening INBOX...');
      imap.openBox('INBOX', true, (err, box) => {
        if (err) {
          console.error('Error opening INBOX:', err);
          imap.end();
          return reject(err);
        }

        console.log(`INBOX opened, searching with criteria:`, searchCriteria);
        imap.search(searchCriteria, (err, results) => {
          if (err) {
            console.error('Error searching:', err);
            imap.end();
            return reject(err);
          }

          if (!results || results.length === 0) {
            console.log('No emails found matching criteria');
            imap.end();
            return resolve([]);
          }

          // Limit results to avoid timeout
          const limitedResults = results.slice(0, maxResults);
          console.log(`Found ${results.length} emails, processing first ${limitedResults.length}`);

          const fetch = imap.fetch(limitedResults, { bodies: '', markSeen: false });
          let processedCount = 0;
          let errorCount = 0;

          fetch.on('message', (msg) => {
            msg.on('body', (stream: Readable) => {
              simpleParser(stream, async (err, parsed) => {
                if (err) {
                  console.error('Parse error:', err);
                  errorCount++;
                  return;
                }

                emails.push({
                  id: parsed.messageId || String(Date.now()),
                  subject: parsed.subject || 'No Subject',
                  date: parsed.date?.toISOString() || new Date().toISOString(),
                  body: parsed.text || parsed.html || '',
                  html: parsed.html || undefined,
                  from: parsed.from?.text || '',
                });

                processedCount++;
                if (!parsed.html && parsed.text) {
                  console.log('Email has no HTML, only text. Subject:', parsed.subject?.substring(0, 50));
                }
                if (processedCount + errorCount === limitedResults.length) {
                  console.log(`Finished processing ${processedCount} emails (${errorCount} errors)`);
                  imap.end();
                }
              });
            });
          });

          fetch.once('error', (err) => {
            console.error('Fetch error:', err);
            imap.end();
            reject(err);
          });

          fetch.once('end', () => {
            console.log('Fetch completed, waiting for parsing to finish...');
            // Wait a bit for all messages to be parsed
            setTimeout(() => {
              console.log('Closing IMAP connection');
              imap.end();
            }, 1000);
          });
        });
      });
    });

    imap.once('error', (err) => {
      console.error('IMAP connection error:', err);
      clearTimeout(timeout);
      reject(err);
    });

    imap.once('end', () => {
      console.log(`IMAP connection closed, returning ${emails.length} emails`);
      clearTimeout(timeout);
      resolve(emails);
    });

    try {
      console.log('Connecting to IMAP server...');
      imap.connect();
    } catch (err) {
      console.error('Error during connect:', err);
      clearTimeout(timeout);
      reject(err);
    }
  });
}

export function buildSearchCriteria(params: {
  from?: string;
  subject?: string;
  since?: Date;
  before?: Date;
  unseen?: boolean;
}): any[] {
  const criteria: any[] = [];

  if (params.from) {
    criteria.push(['FROM', params.from]);
  }

  if (params.subject) {
    criteria.push(['SUBJECT', params.subject]);
  }

  if (params.since) {
    criteria.push(['SINCE', params.since.toISOString().split('T')[0]]);
  }

  if (params.before) {
    criteria.push(['BEFORE', params.before.toISOString().split('T')[0]]);
  }

  if (params.unseen) {
    criteria.push('UNSEEN');
  }

  return criteria.length > 0 ? criteria : ['ALL'];
}
