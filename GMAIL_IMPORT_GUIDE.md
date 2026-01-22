# How to Import LinkedIn Jobs from Gmail

Since the IMAP method is too slow for large mailboxes, here's the recommended approach:

## Step 1: Ask Claude Desktop to Search Gmail

In **Claude Desktop** (or this conversation if you're in the desktop app), paste this prompt:

```
Search my Gmail for emails from LinkedIn about jobs from the last 30 days.
For each job email found, extract:
- Job title
- Company name
- LinkedIn job URL (if present)
- Email date
- Brief summary

Create a JSON file with this exact format and save it to my Downloads folder:

[
  {
    "emailDate": "2026-01-15T10:30:00Z",
    "jobName": "Senior Software Engineer",
    "company": "Example Corp",
    "jobUrl": "https://www.linkedin.com/jobs/view/123456",
    "summary": "Job posting about..."
  }
]

Make sure to only include job recommendation emails, not other LinkedIn notifications.
```

## Step 2: Import the JSON File

1. Open http://localhost:3000
2. Click the **"Import JSON"** button
3. Select the JSON file Claude created
4. Your jobs will be imported!

## JSON Format

The import expects an array of job objects with these fields:

```json
[
  {
    "emailDate": "ISO date string",
    "jobName": "Job title",
    "company": "Company name",
    "jobUrl": "LinkedIn URL",
    "summary": "Description (optional)"
  }
]
```

All fields except `jobName` are optional. The import will handle both single objects and arrays.
