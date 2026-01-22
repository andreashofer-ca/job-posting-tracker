export interface Job {
  id: string;
  emailDate: string;
  jobName: string;
  company: string;
  jobUrl: string;
  criteriaMatch: boolean; // USER INPUT
  followupDescription: string; // USER INPUT
  createdAt: string;
  updatedAt: string;
}

export interface JobsData {
  jobs: Job[];
  lastSync: string | null;
  version: string;
}

export interface Email {
  id: string;
  messageId: string;
  subject: string;
  date: string;
  htmlBody: string;
  textBody: string;
  from: string;
  parsed: boolean; // Whether this email has been parsed into a job
  createdAt: string;
}

export interface EmailsData {
  emails: Email[];
  lastFetch: string | null;
}

export interface GmailSearchParams {
  query?: string;
  dateFrom?: string;
  dateTo?: string;
  unreadOnly?: boolean;
}

export interface EmailSummary {
  jobTitle: string;
  company: string;
  summary: string;
}
