# LinkedIn Job Tracker

A Next.js application that helps you track LinkedIn job recommendations from your Gmail inbox.

## Features

- 🔍 **Gmail Integration**: Search your Gmail for LinkedIn job recommendation emails
- 🤖 **AI Summarization**: Uses Claude to automatically summarize email content
- 📊 **Job Tracking**: Track jobs with custom fields (criteria match, followup notes)
- 📥 **CSV Export**: Download your tracked jobs as a CSV file
- 🎨 **Modern UI**: Built with Next.js 16, TypeScript, and shadcn/ui

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

Then edit `.env.local` and add your API keys:

- `ANTHROPIC_API_KEY`: Get from https://console.anthropic.com
- Gmail OAuth credentials (see Gmail Setup section below)

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Gmail Setup (Optional)

To connect your actual Gmail account:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable the Gmail API
4. Create OAuth 2.0 credentials (Web application)
5. Add redirect URI: `http://localhost:3000/api/gmail/auth/callback`
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
