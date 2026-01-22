# API Keys & MCP Setup Guide

Follow these steps to configure your Job Posting Tracker with real Gmail integration.

## Step 1: Get Anthropic API Key

1. Go to https://console.anthropic.com
2. Sign in or create an account
3. Navigate to "API Keys" section
4. Click "Create Key"
5. Copy your API key (starts with `sk-ant-`)

## Step 2: Set Up Google OAuth for Gmail Access

### 2.1 Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" → "New Project"
3. Name it "Job Posting Tracker" or similar
4. Click "Create"

### 2.2 Enable Gmail API

1. In your new project, go to "APIs & Services" → "Library"
2. Search for "Gmail API"
3. Click on it and press "Enable"

### 2.3 Create OAuth 2.0 Credentials

1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth client ID"
3. If prompted, configure the OAuth consent screen:
   - User Type: **External** (unless you have Google Workspace)
   - App name: "Job Posting Tracker"
   - User support email: your email
   - Developer contact: your email
   - Click "Save and Continue"
   - Skip scopes (click "Save and Continue")
   - Add yourself as a test user
   - Click "Save and Continue"

4. Back to "Create OAuth client ID":
   - Application type: **Web application**
   - Name: "Job Posting Tracker Web Client"
   - Authorized redirect URIs:
     - Add: `http://localhost:3000/api/gmail/auth/callback`
     - Add: `https://developers.google.com/oauthplayground` (for testing)
   - Click "Create"

5. **Download the JSON file** or copy:
   - Client ID (ends with `.apps.googleusercontent.com`)
   - Client Secret

### 2.4 Get Refresh Token

You can use OAuth 2.0 Playground to get your refresh token:

1. Go to [OAuth 2.0 Playground](https://developers.google.com/oauthplayground/)
2. Click the gear icon (⚙️) in top right
3. Check "Use your own OAuth credentials"
4. Paste your Client ID and Client Secret
5. In "Step 1 - Select & authorize APIs":
   - Scroll down to "Gmail API v1"
   - Select: `https://www.googleapis.com/auth/gmail.readonly`
6. Click "Authorize APIs"
7. Sign in with your Google account
8. Click "Allow"
9. In "Step 2 - Exchange authorization code for tokens":
   - Click "Exchange authorization code for tokens"
10. **Copy the Refresh Token** (you'll need this)

## Step 3: Configure Environment Variables

Edit the `.env.local` file in your project root:

```bash
# Anthropic API Key for Claude
ANTHROPIC_API_KEY=sk-ant-your-actual-key-here

# Google OAuth2 Credentials
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-actual-client-secret
GOOGLE_REFRESH_TOKEN=your-actual-refresh-token
```

**Important:** Never commit `.env.local` to git! It's already in `.gitignore`.

## Step 4: Test the Configuration

1. Restart your development server:
   ```bash
   npm run dev
   ```

2. Open http://localhost:3000

3. Click "Search Gmail" - it should now search your actual Gmail account!

## Troubleshooting

### "Access blocked: This app's request is invalid"
- Make sure you added yourself as a test user in the OAuth consent screen
- Check that the redirect URI matches exactly: `http://localhost:3000/api/gmail/auth/callback`

### "invalid_grant" error
- Your refresh token may have expired
- Go back to OAuth Playground and generate a new refresh token
- Make sure you selected the correct Gmail API scope

### No emails found
- Check your Gmail search query in the code
- Default query: `from:linkedin.com (subject:"job" OR subject:"recommended")`
- You can modify this in `/app/api/gmail/search/route.ts`

### Rate limiting
- Gmail API has quotas: 250 units per user per second
- If you hit limits, wait a few minutes before trying again

## Next Steps

Once configured, you can:

1. **Customize the search query** to find different job emails
2. **Add more email sources** beyond LinkedIn (Indeed, Glassdoor, etc.)
3. **Set up automatic syncing** by creating a scheduled job
4. **Deploy to production** (note: you'll need a real database, not JSON files)

## Security Best Practices

✅ **DO:**
- Keep your `.env.local` file secure and never share it
- Use environment variables for all secrets
- Regularly rotate your API keys
- Only grant minimum necessary OAuth scopes

❌ **DON'T:**
- Commit `.env.local` to version control
- Share your refresh token with anyone
- Use production credentials for testing
- Leave OAuth consent screen in "testing" mode forever (if you want others to use it)

## Questions?

If you run into issues:
1. Check the browser console for error messages
2. Check the terminal where `npm run dev` is running
3. Verify all credentials are correctly copied (no extra spaces)
4. Make sure the Gmail API is enabled in your Google Cloud project
