# PicoBase Integration Plan

**Goal:** Allow developers to integrate PicoBase into their projects for auth and database — analogous to what Supabase provides.

**Date:** 2026-02-07

---

## Current State

PicoBase is a **multi-tenant BaaS platform** built on PocketBase. It currently provides:

- A **Next.js dashboard** for managing PocketBase instances
- **Instance lifecycle management** (create, start, stop, delete) via Railway
- **Persistent storage** via Cloudflare R2 backups
- **API key management** for instance access
- **Proxy routing** via subdomains (`{subdomain}.picobase.com`)
- **Auth for the dashboard itself** (SuperTokens or NextAuth — this is platform auth, not end-user auth)

### What's Missing for a Supabase-like Developer Experience

| Capability | Supabase | PicoBase Today |
|---|---|---|
| Client SDK | `@supabase/supabase-js` — one import, two config values | None — developers must use PocketBase SDK directly and manage URLs/auth manually |
| Auth integration | Built-in GoTrue with JWT flowing to DB policies | PocketBase has auth, but no unified SDK wrapping it |
| Database queries | Chainable query builder (`.from().select().eq()`) | Raw PocketBase SDK or REST calls |
| Realtime | WebSocket subscriptions built on WAL | PocketBase has basic SSE realtime, not exposed through PicoBase |
| Storage | Managed buckets with signed URLs | PocketBase has file fields, not exposed as a first-class service |
| Edge Functions | Deno-based serverless functions | None |
| Local development | `supabase start` runs full local stack | No local dev story for integrators |
| Project provisioning API | API to create/manage projects programmatically | Exists (dashboard API) but not designed for external consumption |
| Type safety | Auto-generated TypeScript types from schema | None |
| Row Level Security | PostgreSQL RLS policies | PocketBase has collection-level API rules (similar concept, different mechanism) |

---

## Architecture Vision

```
┌──────────────────────────────────────────────┐
│             Developer's Application          │
│                                              │
│   import { createClient } from 'picobase'    │
│   const pb = createClient(url, apiKey)       │
│                                              │
│   pb.auth.signUp(email, password)            │
│   pb.collection('posts').getList()           │
│   pb.storage.upload('avatars', file)         │
│   pb.realtime.subscribe('posts', callback)   │
└──────────────────┬───────────────────────────┘
                   │ HTTPS / WSS
                   ▼
┌──────────────────────────────────────────────┐
│          PicoBase Gateway Layer              │
│  ┌─────────┬──────────┬─────────┬────────┐  │
│  │  Auth   │ Data API │ Storage │Realtime│  │
│  │ Proxy   │  Proxy   │  Proxy  │ Proxy  │  │
│  └────┬────┴────┬─────┴────┬────┴───┬────┘  │
│       │         │          │        │        │
│  API Key validation + rate limiting + logging│
└───────┼─────────┼──────────┼────────┼────────┘
        │         │          │        │
        ▼         ▼          ▼        ▼
┌──────────────────────────────────────────────┐
│        PocketBase Instance (per tenant)      │
│  ┌──────┐ ┌──────────┐ ┌───────┐ ┌───────┐  │
│  │ Auth │ │Collections│ │ Files │ │  SSE  │  │
│  │Users │ │ + Records │ │       │ │Realtime│  │
│  └──────┘ └──────────┘ └───────┘ └───────┘  │
│                 SQLite                        │
└──────────────────────────────────────────────┘
```

---

## Implementation Plan

### Phase 1: Client SDK (`@picobase/client`)

**Objective:** Ship a JavaScript/TypeScript SDK that developers `npm install` and use with two config values.

#### 1.1 SDK Core — `createClient(url, apiKey)`

Create a new package `packages/client/` (or a separate repo `picobase-js`).

```typescript
import { createClient } from '@picobase/client'

const pb = createClient('https://myapp.picobase.com', 'pbk_abc123...')
```

**Implementation details:**
- Thin wrapper around `pocketbase` JS SDK
- Adds API key injection via `Authorization: Bearer {apiKey}` header on every request
- Configures the PocketBase SDK instance URL to the picobase proxy endpoint
- Handles token refresh and reconnection
- Provides TypeScript generics for collection types

**Key files to create:**
```
packages/
  client/
    src/
      index.ts              # createClient entry point
      client.ts             # PicoBaseClient class
      auth.ts               # Auth module (wraps PocketBase auth)
      collections.ts        # Collection/record operations
      storage.ts            # File storage operations
      realtime.ts           # Realtime subscription wrapper
      types.ts              # TypeScript type definitions
    package.json            # @picobase/client
    tsconfig.json
    README.md
```

**API surface:**

```typescript
// Auth
pb.auth.signUp(email, password)
pb.auth.signIn(email, password)
pb.auth.signInWithOAuth(provider)
pb.auth.signOut()
pb.auth.getUser()
pb.auth.onAuthStateChange(callback)

// Collections (database)
pb.collection('posts').getList(page, perPage, options)
pb.collection('posts').getOne(id, options)
pb.collection('posts').create(data)
pb.collection('posts').update(id, data)
pb.collection('posts').delete(id)
pb.collection('posts').getFirstListItem(filter)
pb.collection('posts').getFullList(options)

// Storage (file fields)
pb.storage.getUrl(record, filename)
pb.storage.getToken(record, filename)  // signed URL

// Realtime
pb.realtime.subscribe('posts', callback)
pb.realtime.subscribe('posts/{id}', callback)
pb.realtime.unsubscribe('posts')
```

**Why wrap PocketBase SDK instead of building from scratch:**
- PocketBase SDK is mature, well-tested, and actively maintained
- PocketBase's auth, realtime, and CRUD APIs map directly to what developers need
- We add value through: seamless API key auth, multi-tenant routing, managed lifecycle, dashboard

#### 1.2 SDK Distribution

- Publish to npm as `@picobase/client` (or `picobase`)
- Provide ESM and CJS builds
- Include TypeScript declarations
- Zero dependencies beyond `pocketbase` SDK
- Target: <10KB gzipped

---

### Phase 2: Gateway Layer Improvements

**Objective:** Make the proxy layer production-ready for external SDK consumers.

#### 2.1 Proxy Hardening

**Current state:** `app/api/proxy/[...path]/route.ts` proxies requests to PocketBase instances via Railway.

**Improvements needed:**

| Task | Description | Priority |
|---|---|---|
| API key auth on proxy | Validate `Authorization: Bearer pbk_...` header on all proxy requests | P0 |
| Auto-start on request | If instance is stopped, automatically start it when a request comes in (cold start) | P0 |
| Rate limiting | Per-API-key rate limits (e.g., 100 req/s free tier) | P1 |
| Request logging | Log API calls per key for usage tracking and billing | P1 |
| CORS configuration | Allow configurable CORS origins per instance | P1 |
| Error responses | Standardized error format: `{ error: { code, message, details } }` | P1 |
| Health endpoint | `GET /api/v1/health` for SDK connection testing | P2 |
| Websocket proxy | Proxy SSE/WebSocket connections for realtime | P1 |

**Key changes to existing files:**
- `app/api/proxy/[...path]/route.ts` — add API key validation, auto-start, rate limiting
- `lib/api-keys.ts` — add rate limit tracking, usage logging
- `middleware.ts` — add CORS header handling for SDK requests

#### 2.2 Instance Auto-Start (Cold Start)

When a stopped instance receives a request via the SDK:

1. SDK sends request → proxy receives it
2. Proxy checks instance status in Turso DB
3. If stopped: trigger start, download DB from R2, launch PocketBase
4. Return `503 Retry-After: 5` to client (SDK auto-retries)
5. Once running, subsequent requests proxy normally

**SDK handles cold start transparently:**
```typescript
// In SDK: automatic retry with backoff on 503
async function fetchWithRetry(url, options, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    const response = await fetch(url, options)
    if (response.status === 503) {
      const retryAfter = response.headers.get('Retry-After') || '5'
      await sleep(parseInt(retryAfter) * 1000)
      continue
    }
    return response
  }
}
```

#### 2.3 Custom Domain Support

Allow users to point their own domain to their PicoBase instance:
- `api.myapp.com` → `myapp.picobase.com` → PocketBase instance
- Requires DNS CNAME + SSL certificate provisioning
- Store custom domain mapping in Turso DB

---

### Phase 3: Auth Enhancement

**Objective:** Make PicoBase auth feel as seamless as Supabase Auth.

#### 3.1 Auth Configuration via Dashboard

Add dashboard UI to configure:
- Allowed OAuth providers (Google, GitHub, Discord, etc.)
- Email templates (verification, password reset)
- JWT settings (expiry, custom claims)
- Redirect URLs

**PocketBase already supports all of these** — the dashboard needs to expose them:
- `PATCH /api/settings` on the PocketBase instance
- OAuth2 provider configuration is in PocketBase settings
- Email templates are configurable via PocketBase admin

**New dashboard pages:**
```
app/dashboard/[instanceId]/settings/
  auth/
    page.tsx           # Auth settings (providers, email, etc.)
    providers/
      page.tsx         # OAuth provider configuration
    emails/
      page.tsx         # Email template editor
```

#### 3.2 Auth Hooks / Webhooks

Allow developers to run custom logic on auth events:
- `onSignUp` — send welcome email, create default data
- `onSignIn` — log analytics, update last login
- `onPasswordReset` — notify user

**Implementation:** PocketBase supports hooks via its Go API, but since we run it as a binary, we need a webhook approach:
- Add a webhook URL config per instance in the dashboard
- PocketBase's `OnRecordAfterCreateRequest` on `users` collection → POST to webhook URL
- Or: use PocketBase's JS hooks (v0.23+) which can execute JavaScript

#### 3.3 Pre-built Auth UI Components

Provide drop-in React components (optional package `@picobase/react`):

```tsx
import { AuthForm, useAuth } from '@picobase/react'

function LoginPage() {
  return <AuthForm
    providers={['google', 'github']}
    redirectTo="/dashboard"
  />
}

function ProtectedPage() {
  const { user, loading } = useAuth()
  if (loading) return <Spinner />
  if (!user) return <Redirect to="/login" />
  return <Dashboard user={user} />
}
```

---

### Phase 4: Developer Experience

**Objective:** Make the "time to first API call" under 5 minutes.

#### 4.1 CLI Tool (`picobase` CLI)

```bash
# Install
npm install -g picobase

# Login
picobase login

# Create a new instance
picobase init my-project
# → Creates instance, outputs URL + API key

# Check status
picobase status

# Open dashboard
picobase dashboard

# View logs
picobase logs --tail
```

**Implementation:** Node.js CLI using `commander` or `yargs`, calling the PicoBase REST API.

#### 4.2 Quickstart Templates

Provide starter templates for popular frameworks:

```bash
picobase init --template next    # Next.js + PicoBase
picobase init --template react   # React + PicoBase
picobase init --template vue     # Vue + PicoBase
picobase init --template svelte  # SvelteKit + PicoBase
```

Each template includes:
- Pre-configured `@picobase/client`
- Auth pages (login, signup, password reset)
- Example CRUD operations
- Environment variable setup

#### 4.3 Type Generation

Auto-generate TypeScript types from collection schemas:

```bash
picobase typegen --output ./src/types/picobase.ts
```

Generates:
```typescript
export interface PostsRecord {
  id: string
  title: string
  content: string
  author: string
  created: string
  updated: string
}

export interface UsersRecord {
  id: string
  email: string
  name: string
  avatar: string
  created: string
  updated: string
}

// Usage with SDK
const posts = await pb.collection<PostsRecord>('posts').getList()
// posts.items is PostsRecord[]
```

**Implementation:** Call PocketBase's `GET /api/collections` endpoint, parse schema, emit TypeScript interfaces.

#### 4.4 Local Development Mode

```bash
picobase dev
# → Starts a local PocketBase instance
# → Prints connection URL (http://localhost:8090)
# → SDK auto-discovers local instance via PICOBASE_URL env var
```

This gives developers Supabase-like local dev parity without needing Docker.

---

### Phase 5: Production Readiness

**Objective:** Make PicoBase reliable enough for production applications.

#### 5.1 Monitoring & Observability

- **Instance health checks** — periodic ping to verify PocketBase is responsive
- **Request metrics** — latency, error rates, throughput per instance
- **Alerting** — notify users when their instance is down or degraded
- **Dashboard metrics page** — show API usage, response times, active connections

#### 5.2 Backup & Recovery

- **Automated backups** — periodic R2 snapshots (every 6 hours, configurable)
- **Point-in-time recovery** — maintain multiple backup versions
- **Backup download** — allow users to export their database
- **Backup restore** — restore from a specific backup version

#### 5.3 Scaling

| Concern | Solution |
|---|---|
| Cold start latency | Keep frequently-used instances warm; pre-download DB from R2 |
| Concurrent requests | PocketBase handles ~10K req/s per instance (SQLite limitation) |
| Large databases | Monitor DB size, warn at thresholds, offer migration path |
| Multiple regions | Deploy Railway instances in multiple regions |
| Instance isolation | Each instance is a separate process with its own DB — already isolated |

#### 5.4 Security

- **API key rotation** — allow creating new keys and deprecating old ones
- **IP allowlisting** — restrict API access by IP range
- **Audit logging** — log all admin operations
- **Data encryption at rest** — R2 already encrypts; ensure transit is TLS-only
- **Collection-level API rules** — expose PocketBase's rule editor in dashboard

---

## Implementation Priority & Phases

### Phase 1: Client SDK (Foundation)
1. Create `@picobase/client` package wrapping PocketBase SDK
2. Implement `createClient(url, apiKey)` initialization
3. Add automatic API key injection into all requests
4. Add cold-start retry logic
5. Publish to npm
6. Write quickstart documentation

### Phase 2: Gateway Hardening
1. Add API key validation to proxy routes
2. Implement auto-start on first request
3. Add CORS configuration
4. Add request logging and usage tracking
5. Standardize error responses
6. Add WebSocket/SSE proxy for realtime

### Phase 3: Auth & Dashboard
1. Add auth provider configuration UI
2. Add OAuth provider setup flow
3. Build email template editor
4. Add webhook configuration for auth events

### Phase 4: Developer Experience
1. Build `picobase` CLI
2. Create quickstart templates (Next.js, React, Vue)
3. Implement type generation from collection schemas
4. Add local development mode

### Phase 5: Production Hardening
1. Automated backups on schedule
2. Health monitoring and alerting
3. Usage metrics dashboard
4. API key rotation and security features

---

## Technical Decisions

### Why wrap PocketBase SDK, not build from scratch?
PocketBase's JS SDK already provides auth, CRUD, realtime, and file handling. Rebuilding this would be months of work with no user-facing benefit. The value PicoBase adds is **managed infrastructure + multi-tenancy + developer experience** — not a new database protocol.

### Why not fork PocketBase?
PocketBase is a Go binary. Forking it means maintaining a Go codebase and losing upstream updates. Instead, we treat PocketBase as an **opaque runtime** and build our value layer on top. If PocketBase adds features (e.g., better realtime), we benefit automatically.

### Why API keys instead of only JWTs?
API keys are simpler for server-to-server communication and initial SDK setup. End-user auth still uses PocketBase's JWT-based auth system underneath. The API key identifies the **instance** (which project), while the JWT identifies the **user** (which person).

### Why SQLite (PocketBase) instead of PostgreSQL (Supabase)?
SQLite provides per-tenant isolation with zero operational overhead. Each instance is a single file, making backup/restore trivial. For the target audience (small-to-medium projects), SQLite handles the load well. This is a deliberate positioning choice — PicoBase targets simplicity over scale.

---

## Success Metrics

| Metric | Target |
|---|---|
| Time to first API call | < 5 minutes |
| SDK bundle size | < 10KB gzipped |
| Cold start latency | < 10 seconds |
| API response latency (warm) | < 100ms (p95) |
| Instance uptime | > 99.5% |
| Documentation completeness | Full SDK reference + 3 framework guides |

---

## Open Questions

1. **Pricing model** — Per-instance? Per-request? Storage-based? Need to decide before building usage tracking.
2. **PocketBase version management** — How do we handle PocketBase upgrades across running instances? Rolling upgrade or user-initiated?
3. **Multi-region** — Should instances be pinned to a region, or should we offer geographic distribution?
4. **Custom PocketBase hooks** — PocketBase v0.23+ supports JS hooks. Should we allow users to upload custom hooks? Security implications?
5. **Managed vs self-hosted** — Should we offer a self-hosted option (like Supabase's self-hosted Docker Compose)?
