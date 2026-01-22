/**
 * Email Data Store
 * 
 * Manages the email database (emails.json) with functions for
 * storing, retrieving, and updating email records.
 */
import fs from 'fs/promises';
import path from 'path';
import { Email, EmailsData } from './types';

const DATA_PATH = path.join(process.cwd(), 'data', 'emails.json');

export async function getEmails(): Promise<EmailsData> {
  try {
    const data = await fs.readFile(DATA_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    return { emails: [], lastFetch: null };
  }
}

export async function saveEmails(data: EmailsData): Promise<void> {
  await fs.writeFile(DATA_PATH, JSON.stringify(data, null, 2), 'utf-8');
}

export async function addEmail(emailData: Omit<Email, 'id' | 'createdAt'>): Promise<Email> {
  const data = await getEmails();
  
  // Check if email already exists by messageId
  const existing = data.emails.find(e => e.messageId === emailData.messageId);
  if (existing) {
    return existing;
  }

  const email: Email = {
    id: crypto.randomUUID(),
    ...emailData,
    createdAt: new Date().toISOString(),
  };

  data.emails.push(email);
  await saveEmails(data);
  return email;
}

export async function getUnparsedEmails(): Promise<Email[]> {
  const data = await getEmails();
  return data.emails.filter(email => !email.parsed);
}

export async function markEmailAsParsed(emailId: string): Promise<void> {
  const data = await getEmails();
  const email = data.emails.find(e => e.id === emailId);
  if (email) {
    email.parsed = true;
    await saveEmails(data);
  }
}

export async function updateLastFetch(): Promise<void> {
  const data = await getEmails();
  data.lastFetch = new Date().toISOString();
  await saveEmails(data);
}

export async function clearAllEmails(): Promise<void> {
  await saveEmails({ emails: [], lastFetch: null });
}
