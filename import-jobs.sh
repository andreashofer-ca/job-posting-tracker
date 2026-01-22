#!/bin/bash

DAYS=${1:-7}

cat << EOF

========================================
LinkedIn Job Importer
========================================

Since Gmail MCP is only available in Claude Desktop (GUI),
please follow these steps:

1. Open Claude Desktop (the GUI app)

2. Copy and paste this prompt:
----------------------------------------

Search my Gmail for emails from LinkedIn with job recommendations from the last ${DAYS} days.

For each job recommendation email:
- Extract job title, company name, LinkedIn URL, and email date
- Create a brief summary (1-2 sentences)

Save to ~/Downloads/linkedin-jobs.json in this format:

[
  {
    "emailDate": "2026-01-20T10:00:00Z",
    "jobName": "Senior Software Engineer",
    "company": "Tech Corp",
    "jobUrl": "https://www.linkedin.com/jobs/view/123456",
    "summary": "Job description"
  }
]

Only include job recommendations, not connection requests or notifications.
Use ISO 8601 dates. Ensure valid JSON.

----------------------------------------

3. After Claude creates the file, import it:
   - Go to http://localhost:3000
   - Click "Import JSON"
   - Select ~/Downloads/linkedin-jobs.json

========================================
EOF
