# Implementation Plan: Vibe Coder DX Improvements

**Target ICP:** Vibe coders — developers who use AI tools (Cursor, Windsurf, Claude, v0), prefer fast iteration, minimal config, and "just works" experiences.

**Date:** 2026-02-09

---

## Completed (Phase 4.1)

These improvements are already shipped:

| Change | Impact | Files |
|--------|--------|-------|
| Actionable SDK errors with `.fix` suggestions | Every error tells you how to fix it | `packages/client/src/errors.ts`, `client.ts` |
| Typed collection helpers via `picobase typegen` | Full autocomplete on collection names + record fields | `packages/cli/src/commands/typegen.ts` |
| React (Vite) template | `picobase init --template react` now scaffolds a full project | `packages/cli/src/commands/init.ts` |
| Single-command dev | `picobase dev --with-app` runs PocketBase + app together | `packages/cli/src/commands/dev.ts` |
| AI assistant context | CLAUDE.md + .cursorrules give AI tools project understanding | `CLAUDE.md`, `.cursorrules` |
| Env validation | Clear startup errors for missing platform env vars | `lib/env.ts` |
| Auto `.env.local` creation | `picobase init` writes credentials to .env.local automatically | `packages/cli/src/commands/init.ts` |

---

## Phase 4.2: Testing & Reliability

**Goal:** Give vibe coders confidence that their code works without manual testing.

**Priority:** Critical — zero test infrastructure exists today.

### 4.2.1 — Add vitest to SDK package

**Effort:** 1 day
**Files:** `packages/client/`

1. Add `vitest` as devDependency in `packages/client/package.json`
2. Create `packages/client/vitest.config.ts`
3. Add test script: `"test": "vitest"`, `"test:watch": "vitest --watch"`
4. Write tests for:
   - `createClient()` — zero-config env detection, explicit args, validation errors
   - `PicoBaseCollection` — mock PocketBase and verify CRUD calls
   - Error classes — verify `code`, `fix`, `toString()` output
   - Cold-start retry logic — mock 503 responses, verify backoff timing
5. Add test for `ConfigurationError` when URL/key are missing

**Acceptance criteria:**
- `npm test` runs from repo root
- Coverage on `errors.ts`, `client.ts`, `collection.ts` > 80%

### 4.2.2 — Add vitest to CLI package

**Effort:** 1 day
**Files:** `packages/cli/`

1. Add `vitest` as devDependency in `packages/cli/package.json`
2. Write tests for:
   - `typegen` — mock API response, verify generated TypeScript output matches expected types
   - `init` — mock API calls, verify file creation for each template
   - `utils` — test `validateSubdomain`, `generateSubdomain`, `parseInstanceUrl`
3. Test React template generates all expected files with correct content

**Acceptance criteria:**
- `cd packages/cli && npm test` passes
- Template generation tests verify file structure

### 4.2.3 — Add React Testing Library tests for hooks

**Effort:** 1 day
**Files:** `packages/react/`

1. Add `vitest`, `@testing-library/react`, `jsdom` as devDependencies
2. Write tests for:
   - `useAuth` — verify sign in/out state changes
   - `useCollection` — verify loading, data, error states
   - `PicoBaseProvider` — verify error when URL/apiKey missing
3. Test that hooks throw clear error when used outside provider

**Acceptance criteria:**
- `cd packages/react && npm test` passes
- Hooks tested with mock PocketBase client

---

## Phase 4.3: Complete Framework Templates

**Goal:** Every popular framework gets a working template. Vibe coders shouldn't have to figure out framework-specific wiring.

### 4.3.1 — Vue 3 template

**Effort:** 0.5 days
**Files:** `packages/cli/src/commands/init.ts`

1. Generate a Vite + Vue 3 + TypeScript project
2. Include:
   - `package.json` with `@picobase_app/client`, `vue`, `vite`, `@vitejs/plugin-vue`
   - `src/picobase.ts` — client setup with `import.meta.env.VITE_PICOBASE_*`
   - `src/App.vue` — example showing auth state and data query
   - `src/composables/usePicoBase.ts` — Vue composable wrapping the client
   - `.env` with VITE_ prefixed vars
   - `vite.config.ts`, `tsconfig.json`
3. Update CLI README with Vue template docs

**Acceptance criteria:**
- `picobase init my-app --template vue && cd my-app && npm install && npm run dev` works

### 4.3.2 — Svelte template

**Effort:** 0.5 days
**Files:** `packages/cli/src/commands/init.ts`

1. Generate a SvelteKit project
2. Include:
   - `package.json` with `@picobase_app/client`, `@sveltejs/kit`, `svelte`
   - `src/lib/picobase.ts` — client setup
   - `src/routes/+page.svelte` — example showing auth and data
   - `.env` with VITE_ prefixed vars (SvelteKit uses Vite)
3. Update CLI README with Svelte template docs

**Acceptance criteria:**
- `picobase init my-app --template svelte && cd my-app && npm install && npm run dev` works

---

## Phase 4.4: Developer Workflow Improvements

**Goal:** Remove friction from daily development loop.

### 4.4.1 — `picobase typegen --watch`

**Effort:** 0.5 days
**Files:** `packages/cli/src/commands/typegen.ts`

1. Add `--watch` / `-w` flag to typegen command
2. Poll the instance schema endpoint every 5 seconds (configurable with `--interval`)
3. On schema change, regenerate types and print a success message
4. Use `chokidar` or simple polling since schema comes from HTTP API

**Why:** Vibe coders change collections in the dashboard and expect types to update automatically. Running `picobase typegen` after every schema change breaks flow.

**Acceptance criteria:**
- `picobase typegen --watch` runs continuously
- Types regenerate within 5s of a collection change in the dashboard

### 4.4.2 — `picobase doctor`

**Effort:** 1 day
**Files:** new `packages/cli/src/commands/doctor.ts`

A diagnostic command that checks everything is set up correctly:

```
$ picobase doctor

  Checking configuration...
  ✓ Auth token valid
  ✓ Current instance: my-app (https://my-app.picobase.com)
  ✓ Instance status: running
  ✓ API key valid (pbk_abc1...)
  ✓ .env.local found with PICOBASE_URL and PICOBASE_API_KEY
  ✓ Node.js v20.11.0
  ✓ TypeScript types up to date (last generated: 2 hours ago)
  ⚠ PocketBase binary outdated (v0.22.0 → v0.23.1 available)

  All checks passed!
```

Checks to implement:
1. Auth token exists and is valid (not expired)
2. Current instance is set
3. Instance is reachable (HTTP health check)
4. API key works (test request)
5. `.env.local` or `.env` exists with required vars
6. Node.js version >= 18
7. Types file exists and was generated recently
8. PocketBase binary version (for `picobase dev`)
9. Package versions of `@picobase_app/client` and `@picobase_app/react` match

**Why:** Single command to debug "it's not working" — the #1 vibe coder complaint.

### 4.4.3 — Seed data for local development

**Effort:** 1 day
**Files:** new `packages/cli/src/commands/seed.ts`

1. Add `picobase seed` command
2. Read a `picobase.seed.ts` or `picobase.seed.json` file from project root
3. Create collections and insert records into the local PocketBase instance
4. Support `--reset` flag to clear existing data first

**Seed file format:**
```typescript
// picobase.seed.ts
import type { SeedConfig } from '@picobase_app/cli'

export default {
  collections: {
    posts: [
      { title: 'First Post', content: 'Hello world', published: true },
      { title: 'Draft Post', content: 'Work in progress', published: false },
    ],
    users: [
      { email: 'admin@example.com', password: 'password', name: 'Admin' },
    ],
  },
} satisfies SeedConfig
```

**Why:** Vibe coders need realistic data to develop against. Without seed data, every local dev session starts empty.

---

## Phase 4.5: Documentation & Discoverability

**Goal:** Make answers findable without leaving the terminal or IDE.

### 4.5.1 — Filter syntax reference

**Effort:** 0.5 days
**Files:** `docs/FILTER_SYNTAX.md`, update `docs/SDK_INTEGRATION_GUIDE.md`

Document PocketBase's filter language with copy-paste examples:

```
# Comparison
filter: 'age > 18'
filter: 'status = "active"'
filter: 'role != "guest"'

# String matching
filter: 'name ~ "john"'          # contains (case-insensitive)
filter: 'email !~ "spam"'        # does not contain

# Dates
filter: 'created > "2024-01-01 00:00:00"'
filter: 'created >= @now'        # server-side now

# Boolean
filter: 'published = true'

# Logic
filter: 'published = true && author = "john"'
filter: 'status = "active" || status = "pending"'

# Relations
filter: 'author.name = "John"'   # dot notation for relations
filter: 'tags ?~ "featured"'     # array contains

# Sorting
sort: '-created'                  # descending
sort: 'title'                     # ascending
sort: '-created,title'            # multi-field
```

**Why:** This is the #1 thing vibe coders Google. PocketBase's filter syntax is not standard SQL and isn't documented in PicoBase docs.

### 4.5.2 — Migration guide from Supabase/Firebase

**Effort:** 1 day
**Files:** `docs/MIGRATION_GUIDE.md`

Write side-by-side comparison guides:

1. **From Supabase:**
   - `supabase.from('posts').select()` → `pb.collection('posts').getList()`
   - `supabase.auth.signUp()` → `pb.auth.signUp()`
   - RLS → PocketBase API rules
   - Env vars: `SUPABASE_URL` → `PICOBASE_URL`

2. **From Firebase:**
   - `collection(db, 'posts')` → `pb.collection('posts')`
   - `addDoc()` → `.create()`
   - `onSnapshot()` → `.subscribe()`
   - Auth: `signInWithEmailAndPassword()` → `pb.auth.signIn()`

**Why:** Capture developers who are frustrated with Supabase's complexity or Firebase's vendor lock-in. Give them a 10-minute migration path.

### 4.5.3 — In-CLI help with examples

**Effort:** 0.5 days
**Files:** `packages/cli/src/index.ts`

Enhance `--help` output for each command with inline examples:

```
$ picobase dev --help

Start local PocketBase instance for development

Usage: picobase dev [options]

Options:
  -p, --port <port>      Port to run on (default: "8090")
  -a, --with-app         Also start your app dev server (npm run dev)
  -r, --run <command>    Custom command to start your app

Examples:
  picobase dev                        # PocketBase only on :8090
  picobase dev --with-app             # PocketBase + npm run dev
  picobase dev -p 9090 --run "vite"   # Custom port + custom command
```

---

## Phase 4.6: API Playground

**Goal:** Let developers test API calls from the browser without Postman/cURL.

**Effort:** 3-5 days
**Files:** `app/dashboard/projects/[id]/playground/`

### Design

Add a "Playground" tab to the project dashboard:

```
┌────────────────────────────────────────────────────────────┐
│ Collection: [posts ▾]    Method: [getList ▾]               │
├────────────────────────────────────────────────────────────┤
│ Page:    [1  ]   Per Page: [20 ]                           │
│ Filter:  [published = true                           ]     │
│ Sort:    [-created                                   ]     │
│ Expand:  [author                                     ]     │
│                                                            │
│  [▶ Run Query]                                             │
├────────────────────────────────────────────────────────────┤
│ Response (200 OK, 45ms):                                   │
│ {                                                          │
│   "items": [                                               │
│     { "id": "abc123", "title": "Hello", ... },             │
│     ...                                                    │
│   ],                                                       │
│   "totalItems": 42                                         │
│ }                                                          │
├────────────────────────────────────────────────────────────┤
│ Code snippet:                                              │
│ const result = await pb.collection('posts').getList(1, 20, │
│   { filter: 'published = true', sort: '-created' }         │
│ )                                                          │
└────────────────────────────────────────────────────────────┘
```

Features:
1. Collection selector (populated from schema)
2. Method selector (getList, getOne, create, update, delete)
3. Dynamic form fields based on method
4. Filter builder with autocomplete on field names
5. Response viewer with syntax highlighting
6. **Code snippet generator** — copy the equivalent SDK code
7. Request timing display

**Why:** Vibe coders want to test ideas instantly. A playground removes the need for Postman, cURL, or writing throwaway scripts.

---

## Phase 4.7: Structured Logging

**Goal:** Make debugging easy for platform operators and end-users.

**Effort:** 2 days
**Files:** `lib/logger.ts`, update all `console.log` calls

### Implementation

1. Create `lib/logger.ts` using `pino` (fastest structured logger)
2. Log levels: `debug`, `info`, `warn`, `error`
3. JSON output in production, pretty-print in development
4. Consistent context fields: `{ instanceId, userId, action, duration }`
5. Replace all `console.log/error` in `lib/*.ts` with structured logger calls
6. Add request logging middleware for API routes

**Log format:**
```json
{
  "level": "info",
  "time": "2026-02-09T12:00:00Z",
  "msg": "Instance started",
  "instanceId": "inst_abc123",
  "userId": "usr_def456",
  "duration": 2340
}
```

---

## Priority & Timeline Summary

| Phase | What | Priority | Effort | Impact |
|-------|------|----------|--------|--------|
| **4.2** | Testing infrastructure | Critical | 3 days | Confidence for all developers |
| **4.3** | Vue + Svelte templates | High | 1 day | Broader framework support |
| **4.4.1** | Typegen watch mode | High | 0.5 days | Removes friction from schema iteration |
| **4.4.2** | `picobase doctor` | High | 1 day | Debugging "it's not working" |
| **4.5.1** | Filter syntax reference | High | 0.5 days | #1 Googled question |
| **4.5.2** | Migration guide | Medium | 1 day | Captures switchers |
| **4.5.3** | CLI help examples | Medium | 0.5 days | Better discoverability |
| **4.4.3** | Seed data command | Medium | 1 day | Better local dev |
| **4.6** | API Playground | Medium | 3-5 days | Visual API exploration |
| **4.7** | Structured logging | Lower | 2 days | Platform observability |

**Recommended execution order:**
1. Testing (4.2) — foundation for everything else
2. Filter docs + typegen watch (4.5.1, 4.4.1) — quick wins, high impact
3. `picobase doctor` (4.4.2) — support deflection
4. Vue/Svelte templates (4.3) — framework coverage
5. Migration guide (4.5.2) — growth driver
6. Seed data (4.4.3) — local dev quality of life
7. API Playground (4.6) — big feature, high impact
8. Structured logging (4.7) — operational maturity

---

## Success Metrics

| Metric | Current | Target |
|--------|---------|--------|
| Time to first API call (new project) | ~5 min | < 2 min |
| Framework templates available | 2 (Next.js, React) | 4 |
| Test coverage (SDK) | 0% | > 80% |
| Error messages with fix suggestions | ~40% | 100% |
| Filter syntax documented | No | Yes, with 20+ examples |
| CLI commands with inline examples | 0 | All |
| Migration guides | 0 | 2 (Supabase, Firebase) |
