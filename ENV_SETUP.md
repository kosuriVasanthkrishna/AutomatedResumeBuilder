# Environment Variable Setup Guide

## ⚠️ IMPORTANT: Never Commit API Keys to GitHub

Your `.env.local` file contains sensitive API keys and should **NEVER** be committed to GitHub. It's already in `.gitignore` to protect your keys.

## Local Development Setup

1. Create a `.env.local` file in the root directory (if it doesn't exist)

2. Add your Groq API key:
   ```env
   GROQ_API_KEY=gsk_your_actual_api_key_here
   ```
   
   **Important:**
   - No spaces around the `=` sign
   - No quotes needed
   - The key should start with `gsk_` for Groq API keys

3. **Restart your development server** after adding/changing the key:
   ```bash
   # Stop the server (Ctrl+C) and restart
   npm run dev
   ```

4. Verify the key is loaded:
   - Check the terminal/console when you make an API request
   - You should see debug logs showing `hasGroqKey: true`

## Vercel Deployment Setup

1. Go to your Vercel project dashboard
2. Navigate to **Settings** > **Environment Variables**
3. Click **Add New**
4. Add:
   - **Name**: `GROQ_API_KEY`
   - **Value**: Your Groq API key (starts with `gsk_`)
   - **Environment**: Select all (Production, Preview, Development)
5. Click **Save**
6. **Redeploy** your application for the changes to take effect

## Troubleshooting

### Error: "AI API key not configured"
- Make sure `.env.local` exists in the root directory
- Check that the key is formatted correctly: `GROQ_API_KEY=your_key_here`
- Restart your development server after adding the key
- For Vercel: Make sure the environment variable is set and you've redeployed

### Error: "Invalid GROQ_API_KEY"
- Verify your API key is correct
- Make sure there are no extra spaces or quotes
- Get a new key from https://console.groq.com/ if needed

### Error: "Rate limit exceeded"
- You've hit Groq's rate limit
- Wait a few minutes and try again
- Consider upgrading your Groq plan if this happens frequently

### Key not working after adding to .env.local
- **Restart your dev server** - Next.js only loads environment variables on startup
- Check the file is named exactly `.env.local` (not `.env` or `.env.local.txt`)
- Make sure the file is in the root directory (same level as `package.json`)

## Getting a Groq API Key

1. Visit https://console.groq.com/
2. Sign up for a free account (no credit card required)
3. Go to **API Keys** section
4. Click **Create API Key**
5. Copy the key (it starts with `gsk_`)
6. Add it to your `.env.local` file or Vercel environment variables

## Security Best Practices

✅ **DO:**
- Keep `.env.local` in `.gitignore` (already done)
- Use different keys for development and production
- Rotate keys if they're accidentally exposed

❌ **DON'T:**
- Commit `.env.local` to Git
- Share your API keys publicly
- Use `NEXT_PUBLIC_` prefix for API keys (exposes them to the client)

