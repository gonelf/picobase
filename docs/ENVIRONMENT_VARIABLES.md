# Environment Variables Guide

Complete reference for all PicoBase environment variables across different use cases.

---

## Table of Contents

1. [End-User Applications (SDK Users)](#end-user-applications-sdk-users)
2. [Platform Development](#platform-development)
3. [Common Mistakes](#common-mistakes)

---

## End-User Applications (SDK Users)

These are the environment variables you use when building applications **with** PicoBase as your backend.

### Standard Environment Variables

For server-side code, CLI tools, or any Node.js environment:

```bash
PICOBASE_URL=https://your-instance.picobase.com
PICOBASE_API_KEY=pbk_abc12345_xxxxxxxxxxxxxxxx
```

### Next.js Projects

For client-side code in Next.js (variables accessible in the browser):

```bash
NEXT_PUBLIC_PICOBASE_URL=https://your-instance.picobase.com
NEXT_PUBLIC_PICOBASE_API_KEY=pbk_abc12345_xxxxxxxxxxxxxxxx
```

**Why the `NEXT_PUBLIC_` prefix?**
Next.js only exposes environment variables to the browser if they start with `NEXT_PUBLIC_`. Without this prefix, the variables are only available server-side.

### Vite Projects

For client-side code in Vite projects (React, Vue, Svelte, etc.):

```bash
VITE_PICOBASE_URL=https://your-instance.picobase.com
VITE_PICOBASE_API_KEY=pbk_abc12345_xxxxxxxxxxxxxxxx
```

**Why the `VITE_` prefix?**
Vite only exposes environment variables to the browser if they start with `VITE_`. This prevents accidentally leaking sensitive server-side secrets to the client.

### Auto-Detection

The PicoBase SDK automatically detects the correct variables based on your environment:

```typescript
import { createClient } from '@picobase_app/client'

// No arguments needed - auto-detects from environment
const pb = createClient()
```

Detection order:
1. Checks `PICOBASE_URL` or `NEXT_PUBLIC_PICOBASE_URL` or `VITE_PICOBASE_URL`
2. Checks `PICOBASE_API_KEY` or `NEXT_PUBLIC_PICOBASE_API_KEY` or `VITE_PICOBASE_API_KEY`

### Getting Your Values

**Instance URL:**
- Format: `https://your-subdomain.picobase.com` or `https://your-subdomain.picobase.app`
- Get it from: PicoBase dashboard → Your instance → Settings
- **Important:** Use your **instance URL**, not the platform URL (`https://picobase.app`)

**API Key:**
- Format: Starts with `pbk_` (e.g., `pbk_abc12345_xxxxxxxxxxxxxxxx`)
- Get it from: PicoBase dashboard → Your instance → API Keys → Create API Key
- **Important:** API keys are only shown once. Save them securely.

### Example `.env.local` Files

#### Next.js
```bash
# .env.local
NEXT_PUBLIC_PICOBASE_URL=https://myapp.picobase.com
NEXT_PUBLIC_PICOBASE_API_KEY=pbk_abc12345_xxxxxxxxxxxxxxxx
```

#### Vite (React/Vue/Svelte)
```bash
# .env.local
VITE_PICOBASE_URL=https://myapp.picobase.com
VITE_PICOBASE_API_KEY=pbk_abc12345_xxxxxxxxxxxxxxxx
```

#### Node.js / Backend
```bash
# .env
PICOBASE_URL=https://myapp.picobase.com
PICOBASE_API_KEY=pbk_abc12345_xxxxxxxxxxxxxxxx
```

---

## Platform Development

These are the environment variables needed when developing the PicoBase **platform itself** (not when using PicoBase as a backend).

### Required Variables

```bash
# Database (Turso)
TURSO_DATABASE_URL=libsql://your-database.turso.io
TURSO_AUTH_TOKEN=your-turso-auth-token

# Cloudflare R2 Storage
R2_ACCOUNT_ID=your-cloudflare-account-id
R2_ACCESS_KEY_ID=your-r2-access-key-id
R2_SECRET_ACCESS_KEY=your-r2-secret-access-key
R2_BUCKET_NAME=picobase-instances
R2_ENDPOINT=https://your-account-id.r2.cloudflarestorage.com

# Authentication Provider
AUTH_PROVIDER=supertokens
NEXT_PUBLIC_AUTH_PROVIDER=supertokens

# SuperTokens (if AUTH_PROVIDER=supertokens)
SUPERTOKENS_CONNECTION_URI=https://st-dev-your-app-id.aws.supertokens.io
SUPERTOKENS_API_KEY=your-supertokens-api-key

# NextAuth (if AUTH_PROVIDER=nextauth)
NEXTAUTH_URL=http://localhost:3000/api/identity
NEXTAUTH_SECRET=your-nextauth-secret-generated-with-openssl

# Platform Configuration
PLATFORM_DOMAIN=localhost:3000
INSTANCES_DOMAIN=localhost:3001
POCKETBASE_BINARY_PATH=/usr/local/bin/pocketbase
INSTANCES_BASE_PORT=8090

# Railway Service (optional, for production)
RAILWAY_API_URL=https://your-service.railway.app
RAILWAY_API_KEY=your-shared-secret-key
```

See `.env.example` in the repository root for a complete template.

---

## Common Mistakes

### ❌ Wrong: Using platform URL instead of instance URL

```bash
# DON'T DO THIS
NEXT_PUBLIC_PICOBASE_URL=https://picobase.app
```

**Why it's wrong:** `https://picobase.app` is where you manage your instances, not where your data lives.

**Correct:**
```bash
NEXT_PUBLIC_PICOBASE_URL=https://myapp.picobase.com
```

---

### ❌ Wrong: Using non-existent admin variables

```bash
# DON'T DO THIS
PICOBASE_ADMIN_EMAIL=your-admin-email
PICOBASE_ADMIN_PASSWORD=your-admin-password
```

**Why it's wrong:** These variables don't exist in PicoBase. Authentication uses API keys, not email/password credentials in environment variables.

**Correct:**
```bash
PICOBASE_URL=https://myapp.picobase.com
PICOBASE_API_KEY=pbk_abc12345_xxxxxxxxxxxxxxxx
```

---

### ❌ Wrong: Using snake_case or alternate names

```bash
# DON'T DO THIS
picobase_url=https://myapp.picobase.com
picobase_secret=pbk_abc12345_xxxxxxxxxxxxxxxx
PICOBASE_SECRET=pbk_abc12345_xxxxxxxxxxxxxxxx
PICOBASE_KEY=pbk_abc12345_xxxxxxxxxxxxxxxx
```

**Why it's wrong:** The SDK specifically looks for `PICOBASE_API_KEY` (or with framework prefixes), not `PICOBASE_SECRET`, `PICOBASE_KEY`, or lowercase variants.

**Correct:**
```bash
PICOBASE_URL=https://myapp.picobase.com
PICOBASE_API_KEY=pbk_abc12345_xxxxxxxxxxxxxxxx
```

---

### ❌ Wrong: Missing framework prefix in client-side code

```bash
# DON'T DO THIS (Next.js client-side)
PICOBASE_URL=https://myapp.picobase.com
PICOBASE_API_KEY=pbk_abc12345_xxxxxxxxxxxxxxxx
```

**Why it's wrong:** Without `NEXT_PUBLIC_` prefix, these variables won't be available in the browser and your client-side code will fail.

**Correct for Next.js:**
```bash
NEXT_PUBLIC_PICOBASE_URL=https://myapp.picobase.com
NEXT_PUBLIC_PICOBASE_API_KEY=pbk_abc12345_xxxxxxxxxxxxxxxx
```

---

### ❌ Wrong: Installing the wrong package

```bash
# DON'T DO THIS
npm install pocketbase
```

**Why it's wrong:** PicoBase users should install `@picobase_app/client`, not the raw `pocketbase` package.

**Correct:**
```bash
npm install @picobase_app/client
npm install @picobase_app/react  # for React projects
```

---

## Quick Reference

| Framework | URL Variable | API Key Variable |
|-----------|-------------|------------------|
| Node.js / Backend | `PICOBASE_URL` | `PICOBASE_API_KEY` |
| Next.js (client) | `NEXT_PUBLIC_PICOBASE_URL` | `NEXT_PUBLIC_PICOBASE_API_KEY` |
| Vite (React/Vue/Svelte) | `VITE_PICOBASE_URL` | `VITE_PICOBASE_API_KEY` |

**Remember:**
- Instance URL format: `https://your-app.picobase.com` or `https://your-app.picobase.app`
- API key format: Starts with `pbk_`
- Never commit `.env` files to git
- Add `.env.local` to your `.gitignore`
