# Simple Gmail Setup (App Password)

This is much simpler than OAuth - perfect for local development!

## Step 1: Enable 2-Factor Authentication (if not already enabled)

1. Go to https://myaccount.google.com/security
2. Under "Signing in to Google", click "2-Step Verification"
3. Follow the steps to enable it (you'll need your phone)

## Step 2: Generate Gmail App Password

1. Go to https://myaccount.google.com/apppasswords
   - Or: Google Account → Security → 2-Step Verification → App passwords

2. You might need to sign in again

3. Under "Select app":
   - Choose "Mail" or "Other (Custom name)"
   - If custom, name it "Job Posting Tracker"

4. Under "Select device":
   - Choose "Other (Custom name)"
   - Name it "Job Tracker Local"

5. Click "Generate"

6. **Copy the 16-character password** (looks like: `xxxx xxxx xxxx xxxx`)
   - Remove spaces when you paste it
   - This is your GMAIL_APP_PASSWORD

## Step 3: Update .env.local

Edit your `.env.local` file:

```bash
GMAIL_EMAIL=your-actual-email@gmail.com
GMAIL_APP_PASSWORD=abcdefghijklmnop
```

**Important:**
- Use your full Gmail address (e.g., `john.doe@gmail.com`)
- The app password is 16 characters, no spaces
- Never commit `.env.local` to git!

## Step 4: Restart the Server

```bash
# Kill the current server (Ctrl+C)
npm run dev
```

## Step 5: Test It!

1. Open http://localhost:3000
2. Click "Search Gmail"
3. It should now search your actual Gmail inbox for job emails!

## Default Search Query

The app searches for:
- **From:** LinkedIn
- **Subject:** Contains "job" or "recommended"

You can customize this in `/app/api/gmail/search/route.ts`

## Troubleshooting

### "Invalid credentials" error
- Double-check your email address is correct
- Make sure the app password has no spaces
- Verify 2FA is enabled on your Google account

### "Less secure app access" message
- This doesn't apply to app passwords
- App passwords work even with modern security settings

### No emails found
- Check if you have LinkedIn job emails
- Try searching in Gmail directly with: `from:linkedin.com subject:job`
- Modify the search query in the code if needed

## Security Notes

✅ **Safe:**
- App passwords are designed for this use case
- They only work for the specific app (not full account access)
- You can revoke them anytime at https://myaccount.google.com/apppasswords

⚠️ **Remember:**
- Never share your app password
- Don't commit `.env.local` to version control
- Revoke unused app passwords periodically

## Alternative: Manual Entry

If you prefer not to use Gmail API at all:
1. Read your emails manually
2. Click "Add Job" button in the app (we can add this)
3. Manually enter job details
4. Track everything in the app

Want me to add a manual entry form instead?
