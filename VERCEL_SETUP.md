# Vercel Preview Deployment Setup

## Issue
PR preview links fail because required environment variables aren't configured for Vercel preview deployments.

## Required Environment Variables

### Critical (Must Set in Vercel)

Go to: **Vercel Dashboard → Your Project → Settings → Environment Variables**

Set these for **Preview** environment:

```bash
# Database (Turso)
TURSO_DATABASE_URL=libsql://your-database.turso.io
TURSO_AUTH_TOKEN=your-turso-auth-token

# Authentication (use NextAuth for previews, simpler than SuperTokens)
AUTH_PROVIDER=nextauth
NEXT_PUBLIC_AUTH_PROVIDER=nextauth
NEXTAUTH_SECRET=your-generated-secret-key
# NEXTAUTH_URL will be auto-set by Vercel to preview URL

# Cloudflare R2
R2_ACCOUNT_ID=your-account-id
R2_ACCESS_KEY_ID=your-access-key
R2_SECRET_ACCESS_KEY=your-secret-key
R2_BUCKET_NAME=picobase-instances
R2_ENDPOINT=https://your-account-id.r2.cloudflarestorage.com

# Railway Service
RAILWAY_API_URL=https://your-service.railway.app
RAILWAY_API_KEY=your-shared-secret

# Platform Config
INSTANCES_DOMAIN=localhost:3001
```

### Optional (for specific features)

```bash
# Only if using SuperTokens instead of NextAuth
SUPERTOKENS_CONNECTION_URI=https://st-dev-xxx.aws.supertokens.io
SUPERTOKENS_API_KEY=your-api-key
```

## How to Set Environment Variables in Vercel

### Method 1: Vercel Dashboard (Recommended)

1. Go to https://vercel.com/dashboard
2. Select your project (`picobase`)
3. Click **Settings** tab
4. Click **Environment Variables** in sidebar
5. For each variable:
   - **Key**: Variable name (e.g., `TURSO_DATABASE_URL`)
   - **Value**: Variable value
   - **Environments**: Check **Preview** (and Production if needed)
   - Click **Save**

### Method 2: Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Link to your project
vercel link

# Add environment variables
vercel env add TURSO_DATABASE_URL preview
# Paste the value when prompted

# Repeat for all variables
```

### Method 3: Import from .env file

```bash
# Copy your .env.local
vercel env pull .env.vercel.preview

# Import to Vercel (must be done from Vercel CLI)
# Note: This requires manual setup, use Method 1 or 2 instead
```

## Recommended Configuration for Previews

### Use NextAuth Instead of SuperTokens

**Why?**
- SuperTokens requires callback URL configuration for each preview deployment
- NextAuth auto-configures with Vercel preview URLs
- Simpler for PR reviews

**Set in Vercel:**
```bash
AUTH_PROVIDER=nextauth
NEXT_PUBLIC_AUTH_PROVIDER=nextauth
NEXTAUTH_SECRET=<generate-with-openssl>
```

**Generate NEXTAUTH_SECRET:**
```bash
openssl rand -base64 32
```

### Share Database (Turso)

Use the **same Turso database** for all previews:
- Previews share data (acceptable for testing)
- Each preview creates its own instances
- Avoids database setup per preview

### Share Railway Service

Use the **same Railway service** for all previews:
- RAILWAY_API_URL points to production Railway
- Instances are isolated by subdomain
- No additional deployment needed

## Verifying Setup

After setting environment variables:

1. **Trigger a new deployment:**
   ```bash
   git commit --allow-empty -m "Trigger Vercel rebuild"
   git push
   ```

2. **Check deployment logs:**
   - Go to Vercel deployment
   - Click on deployment
   - Check **Build Logs** for errors
   - Check **Runtime Logs** if build succeeds

3. **Test the preview URL:**
   - Visit preview URL (e.g., `https://picobase-xxx.vercel.app`)
   - Should redirect to `/login` or `/auth`
   - Try creating an account
   - Try logging in

## Common Issues

### "Railway API not configured"
**Cause:** Missing `RAILWAY_API_URL` or `RAILWAY_API_KEY`
**Fix:** Add these to Vercel env vars for Preview environment

### "Unauthorized" on login
**Cause:** Missing database credentials or wrong AUTH_PROVIDER
**Fix:**
1. Ensure TURSO variables are set
2. Ensure AUTH_PROVIDER matches configuration

### Redirect loops
**Cause:** NEXTAUTH_URL pointing to wrong domain
**Fix:** Remove NEXTAUTH_URL from Vercel (auto-configured) or set to preview URL

### "Instance not running" errors
**Cause:** Railway service not accessible
**Fix:** Verify RAILWAY_API_URL is publicly accessible

## Quick Fix (5 minutes)

**Minimum viable setup for PR previews:**

```bash
# Set these 6 variables in Vercel (Preview environment)
TURSO_DATABASE_URL=<your-turso-url>
TURSO_AUTH_TOKEN=<your-turso-token>
AUTH_PROVIDER=nextauth
NEXT_PUBLIC_AUTH_PROVIDER=nextauth
NEXTAUTH_SECRET=<openssl-rand-base64-32>
RAILWAY_API_URL=<your-railway-url>
RAILWAY_API_KEY=<your-railway-key>

# Optional (for R2 storage)
R2_ACCOUNT_ID=<if-you-have-it>
R2_ACCESS_KEY_ID=<if-you-have-it>
R2_SECRET_ACCESS_KEY=<if-you-have-it>
R2_BUCKET_NAME=picobase-instances
R2_ENDPOINT=<your-r2-endpoint>
```

After setting, redeploy your PR and preview should work!

## Automatic NEXTAUTH_URL

Vercel automatically sets `NEXTAUTH_URL` to the preview deployment URL. You don't need to configure it manually.

If you need to override:
```bash
NEXTAUTH_URL=https://picobase-xxx.vercel.app/api/identity
```

## Production vs Preview

**Production Environment:**
- Can use SuperTokens or NextAuth
- Configure production domains
- Use production Railway/R2/Turso

**Preview Environment:**
- Recommended: NextAuth (simpler)
- Share staging resources
- Faster to configure

## Testing Checklist

- [ ] Preview URL loads without errors
- [ ] Can access `/login` page
- [ ] Can create account
- [ ] Can login
- [ ] Can access `/dashboard`
- [ ] Can view instances (if any)
- [ ] No console errors

## Still Not Working?

Check Vercel deployment logs:
1. Go to Vercel dashboard
2. Click on the failing deployment
3. Check **Build Logs** tab
4. Check **Functions** tab for runtime errors
5. Look for missing environment variable errors

Common error messages:
- `TURSO_DATABASE_URL is not defined` → Add to Vercel env vars
- `Cannot connect to database` → Check Turso credentials
- `Railway API not configured` → Add RAILWAY_API_URL and KEY
- `SuperTokens connection failed` → Switch to NextAuth or configure SuperTokens

## Support

If still having issues, check:
1. Vercel build logs
2. Browser console (F12)
3. Network tab for failed requests
4. Verify all env vars are set for **Preview** environment
