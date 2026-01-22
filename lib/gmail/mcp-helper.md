# Using Gmail MCP to Import Jobs

Since your Gmail MCP connector is working in Claude Desktop, you can use it to search for LinkedIn job emails and import them to your tracker.

## How to Use

1. **In Claude Desktop (this conversation), ask:**
   ```
   Search my Gmail for emails from LinkedIn about jobs from the last 30 days.
   For each job email, extract the job title, company, LinkedIn URL, and create
   a JSON file with the results in this format:

   [
     {
       "emailDate": "2026-01-15T10:30:00Z",
       "jobName": "Senior Software Engineer",
       "company": "Example Corp",
       "jobUrl": "https://www.linkedin.com/jobs/view/123456",
       "summary": "Brief description of the job posting"
     }
   ]

   Save to /Users/andreashofer/Projects/linkedin-job-tracker/data/gmail-import.json
   ```

2. **Then in your browser, use the "Import JSON" button** (we'll add this next)

This approach lets you use the powerful Gmail MCP connector you already have configured!
