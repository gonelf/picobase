# PicoBase — AI Assistant Context

PicoBase is a managed Backend-as-a-Service (BaaS) platform — a Supabase alternative built on PocketBase. It gives developers zero-config database, auth, realtime, and file storage without managing infrastructure.

## Architecture

**Monorepo with 4 main parts:**

1. **Root (`/`)** — Next.js 14 App Router platform dashboard + API. Manages user accounts, instances, billing.
2. **`packages/client`** — `@picobase_app/client` SDK. Wraps PocketBase with cold-start retry, API key injection, typed collections.
3. **`packages/react`** — `@picobase_app/react` hooks + components. `PicoBaseProvider`, `useAuth`, `useCollection`, `AuthForm`.
4. **`packages/cli`** — `@picobase_app/cli` CLI tool. `picobase init`, `picobase dev`, `picobase typegen`, etc.

**Data layer:** Turso (libsql) for platform metadata, per-tenant PocketBase (SQLite) instances hosted on Railway.

## Key Patterns

### SDK usage (what end-users write)
```ts
import { createClient } from '@picobase_app/client'

// Zero-config — reads PICOBASE_URL and PICOBASE_API_KEY from env
const pb = createClient()

// Auth
const user = await pb.auth.signUp({ email: '...', password: '...' })
await pb.auth.signIn({ email: '...', password: '...' })

// CRUD — collections auto-create on first write
const post = await pb.collection('posts').create({ title: 'Hello' })
const posts = await pb.collection('posts').getList(1, 20, {
  filter: 'published = true',
  sort: '-created',
})

// Realtime
const unsub = await pb.collection('posts').subscribe((e) => {
  console.log(e.action, e.record)
})
```

### React usage
```tsx
import { PicoBaseProvider, useAuth, useCollection } from '@picobase_app/react'

// Wrap app in provider
<PicoBaseProvider url={process.env.PICOBASE_URL!} apiKey={process.env.PICOBASE_API_KEY!}>
  <App />
</PicoBaseProvider>

// Use hooks
const { user, signIn, signOut } = useAuth()
const { data: posts, loading } = useCollection('posts')
```

### Environment variables
- `PICOBASE_URL` — Instance URL (e.g., `https://myapp.picobase.com`)
- `PICOBASE_API_KEY` — API key starting with `pbk_`
- Next.js client-side: prefix with `NEXT_PUBLIC_`
- Vite client-side: prefix with `VITE_`

### Filter syntax (PocketBase query language)
```
filter: 'published = true'
filter: 'status = "active" && created > "2024-01-01"'
filter: 'author.name ~ "John"'     // contains
filter: 'tags ?~ "featured"'        // array contains
sort: '-created'                     // descending
sort: '+title,-created'             // multi-field
expand: 'author,comments'           // load relations
```

## File structure
```
app/                    Next.js pages + API routes
  api/instances/        Instance CRUD endpoints
  api/proxy/            Subdomain proxy routing
  dashboard/            Dashboard pages
lib/                    Platform business logic
  db.ts                 Turso client + types
  pocketbase.ts         Instance lifecycle
  env.ts                Env var validation
  api-keys.ts           Key generation/validation
packages/client/src/    SDK source
  client.ts             PicoBaseClient + createClient()
  collection.ts         CRUD operations
  auth.ts               Auth module
  errors.ts             Error classes with fix suggestions
  realtime.ts           WebSocket subscriptions
packages/react/src/     React bindings
  hooks.ts              useAuth, useCollection, useRealtime
  PicoBaseProvider.tsx  Context provider
packages/cli/src/       CLI commands
  commands/init.ts      Project scaffolding
  commands/dev.ts       Local dev server
  commands/typegen.ts   TypeScript type generation
scripts/
  migrate.js            Platform DB schema (Turso)
```

## Development commands
```bash
npm run dev              # Start Next.js dev server (platform dashboard)
npm run build            # Run migrations + build
npm run lint             # ESLint

# Package development
cd packages/client && npm run build   # Build SDK
cd packages/react && npm run build    # Build React package
cd packages/cli && npm run build      # Build CLI

# Database
npm run db:migrate       # Create/update platform schema in Turso
npm run db:migrate:admin # Add admin credential columns
```

## Common tasks for AI assistants

**Adding a new SDK feature:** Edit `packages/client/src/`, update types in `types.ts`, export from `index.ts`.

**Adding a new API endpoint:** Create route in `app/api/`, use `db` from `lib/db.ts` for data access.

**Adding a CLI command:** Create file in `packages/cli/src/commands/`, register in `packages/cli/src/index.ts`.

**Adding a React hook:** Add to `packages/react/src/hooks.ts`, export from `packages/react/src/index.ts`.
