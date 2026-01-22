# Using Claude's Gmail MCP Connector

Since you already have the Gmail MCP connector configured with Claude, you can use it in two ways:

## Option 1: Use Claude Directly (Recommended)

The simplest approach - just ask Claude (me!) to search your Gmail and I'll add jobs to the tracker:

1. **In this conversation, ask me:**
   ```
   "Search my Gmail for LinkedIn job emails from the last week and add them to the job tracker"
   ```

2. **I'll use my Gmail MCP tools to:**
   - Search your Gmail using `mcp__gmail__search_emails`
   - Read the email content using `mcp__gmail__read_email`
   - Extract job URLs and summarize with Claude
   - Add jobs via the API: `POST /api/jobs`

3. **You review and update:**
   - Open http://localhost:3000
   - See the jobs I added
   - Click "Open" to view each job posting
   - Set "Match" to Yes/No
   - Add your followup notes

## Option 2: Automated Gmail Search (In App)

If you want the app to search Gmail automatically when you click the button, you would need to:

1. Run the Next.js app with MCP server access (complex setup)
2. Or use the IMAP approach I just built (simpler)

## Recommendation

**Use Option 1** - it's the easiest! Just ask me to search your Gmail and I'll populate the tracker for you. This leverages the Gmail MCP you already have configured.

## Example Workflow

```
You: "Search my Gmail for job emails from LinkedIn in the last 7 days"

Me: [Uses Gmail MCP to find emails]
    [Extracts job info and adds to tracker]
    "I found 5 job postings and added them to your tracker!"

You: [Opens http://localhost:3000]
    [Reviews jobs, clicks Open to view each one]
    [Sets Match and adds notes]
    [Exports to CSV when done]
```

Would you like me to search your Gmail now?
