# LinkedIn Job Tracker

A Next.js application that helps you track LinkedIn job recommendations from your Gmail inbox using AI-powered parsing.

## Features

- 📧 **Gmail Integration**: Fetch job alert emails from Gmail using IMAP
- 🤖 **AI-Powered Parsing**: Uses Claude AI to extract job details from emails
- 📊 **Two-Step Workflow**: Separate email fetching and parsing for better control
- ✏️ **Job Tracking**: Track jobs with custom fields (criteria match, followup notes)
- 📥 **CSV Export**: Download your tracked jobs as a CSV file
- 🎨 **Modern UI**: Built with Next.js 16, TypeScript, and shadcn/ui

## Architecture

The application uses a two-step workflow:

1. **Fetch Emails**: Retrieve job alert emails from Gmail and store them locally in `emails.json`
2. **Parse Emails**: Use Claude AI to parse each email and extract job information into `jobs.json`

This separation allows you to:
- Fetch emails once and parse multiple times if needed
- Avoid hitting Gmail API limits
- Debug parsing issues without re-fetching emails
- Keep raw email data for future reference

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Environment Variables

Copy the example environment file:

```bash
cp .env.local.example .env.local
```

Then edit `.env.local` and add your credentials:

```env
# Required: Anthropic API key for Claude AI parsing
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# Required: Gmail IMAP credentials
GMAIL_EMAIL=your_email@gmail.com
GMAIL_APP_PASSWORD=your_gmail_app_password

# Job alert sender email (default: LinkedIn)
JOB_ALERT_SENDER=jobalerts-noreply@linkedin.com
```

**Getting API Keys:**
- **Anthropic API**: Sign up at https://console.anthropic.com
  - Note: You'll need Claude 3 Haiku model access (or update the model in `app/api/emails/parse/route.ts`)
- **Gmail App Password**: Follow the [Gmail App Password guide](SIMPLE_GMAIL_SETUP.md)

### 3. Run Development Server

```bash
npm run dev
```

Or for production:

```bash
npm run build
npm start
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## How to Use

1. **Fetch Emails**: Click "Fetch Emails from Gmail" to retrieve job alerts from your inbox
2. **Review Emails**: Check the count of unparsed emails
3. **Parse Emails**: Click "Parse X Emails into Jobs" to extract job information using AI
4. **Track Jobs**: View jobs in the table, add criteria match status and followup notes
5. **Export**: Click "Export to CSV" to download your job list

## Project Structure

```
linkedin-job-tracker/
├── app/
│   ├── api/
│   │   ├── emails/
│   │   │   ├── fetch/route.ts    # Fetch emails from Gmail
│   │   │   ├── parse/route.ts    # Parse emails with Claude
│   │   │   └── route.ts          # Get emails list
│   │   └── jobs/
│   │       ├── route.ts          # CRUD operations for jobs
│   │       └── export/route.ts   # CSV export
│   ├── page.tsx                  # Main application page
│   └── layout.tsx
├── components/
│   ├── gmail-search-form.tsx     # Email fetch/parse UI
│   ├── job-table.tsx             # Jobs display table
│   └── ui/                       # shadcn/ui components
├── lib/
│   ├── data/
│   │   ├── emails-store.ts       # Email database operations
│   │   ├── jobs-store.ts         # Job database operations
│   │   └── types.ts              # TypeScript interfaces
│   └── gmail/
│       └── imap-client.ts        # Gmail IMAP client
└── data/
    ├── emails.json               # Raw email storage
    └── jobs.json                 # Parsed job storage
```

## Database Schema

### emails.json
```typescript
{
  emails: [
    {
      id: string;
      messageId: string;
      subject: string;
      date: string;
      htmlBody: string;
      textBody: string;
      from: string;
      parsed: boolean;
      createdAt: string;
    }
  ],
  lastFetch: string | null;
}
```

### jobs.json
```typescript
{
  jobs: [
    {
      id: string;
      emailDate: string;
      jobName: string;
      jobUrl: string;
      company: string;
      criteriaMatch: boolean;
      followupDescription: string;
      createdAt: string;
      updatedAt: string;
    }
  ],
  lastSync: string | null;
  version: string;
}
```
6. Download credentials and add to `.env.local`

**Note**: The current version uses mock data. Full Gmail MCP integration is planned for future releases.

## Usage

### Search for Jobs

1. Use the search form on the left to query your Gmail
2. Set date ranges and filters as needed
3. Click "Search Gmail"

### Track Jobs

- **Criteria Match**: Check the box if the job matches your criteria
- **Followup Notes**: Click the notes field to add your own notes about the job
- **Open Job**: Click the "Open" button to view the job posting in LinkedIn

### Export Data

1. Select "All Jobs" or "Matched Only" from the dropdown
2. Click "Export CSV"
3. File will download as `linkedin-jobs-YYYY-MM-DD.csv`

## Project Structure

```
linkedin-job-tracker/
├── app/
│   ├── api/
│   │   ├── jobs/         # CRUD API for jobs
│   │   └── gmail/        # Gmail search integration
│   └── page.tsx          # Main dashboard
├── components/
│   ├── ui/               # shadcn/ui components
│   ├── job-table.tsx     # Job listing table
│   ├── gmail-search-form.tsx
│   └── export-button.tsx
├── lib/
│   └── data/
│       ├── types.ts      # TypeScript interfaces
│       └── jobs-store.ts # JSON file operations
└── data/
    └── jobs.json         # Local job storage
```

## Tech Stack

- **Framework**: Next.js 16 with App Router
- **Language**: TypeScript
- **UI**: shadcn/ui + Tailwind CSS
- **AI**: Claude 3.5 Sonnet via Anthropic SDK
- **Data**: Local JSON file storage
- **Table**: TanStack Table

## Development Notes

- Data is stored in `data/jobs.json` locally
- Mock Gmail data is used by default
- To add real Gmail integration, configure the Gmail MCP server

## Future Enhancements

- Full Gmail MCP server integration
- Database migration (PostgreSQL/SQLite)
- Auto-tagging based on job keywords
- Email notifications for new jobs
- Multi-user support with authentication

## License

MIT
