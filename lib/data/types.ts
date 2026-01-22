export interface Job {
  id: string;
  emailDate: string;
  jobName: string;
  company: string;
  jobUrl: string;
  criteriaMatch: boolean; // USER INPUT
  followupDescription: string; // USER INPUT
  summary: string; // Claude-generated from email
  emailSubject: string;
  emailId: string;
  createdAt: string;
  updatedAt: string;
}

export interface JobsData {
  jobs: Job[];
  lastSync: string | null;
  version: string;
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
