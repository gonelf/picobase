# PicoBase

**The backend for flow state.** A Supabase alternative that gets out of your way so you can ship.

```bash
npm install @picobase/client
```

```ts
import { createClient } from '@picobase/client'

const pb = createClient() // reads PICOBASE_URL and PICOBASE_API_KEY from .env

// Just write data. Collections create themselves.
await pb.collection('posts').create({
  title: 'My first post',
  published: true,
})

// Query with filtering, sorting, pagination
const posts = await pb.collection('posts').getList(1, 20, {
  filter: 'published = true',
  sort: '-created',
})
```

That's it. No SQL migrations. No schema files. No dashboard to configure.

---

## Quick Start

### 1. Create a PicoBase project

```bash
npx picobase init my-app --template next
cd my-app
npm install
```

This creates your cloud instance, generates an API key, and scaffolds a Next.js project with everything wired up.

### 2. Add your env vars

The CLI creates `.env.local` for you automatically:

```env
PICOBASE_URL=https://my-app.picobase.com
PICOBASE_API_KEY=pbk_abc123_secret
```

### 3. Start building

```bash
npm run dev
```

### 4. Ship

```bash
git push  # that's it
```

---

## React Integration

```bash
npm install @picobase/react
```

### Provider setup (one time)

```tsx
import { PicoBaseProvider } from '@picobase/react'

function App() {
  return (
    <PicoBaseProvider
      url={process.env.PICOBASE_URL!}
      apiKey={process.env.PICOBASE_API_KEY!}
    >
      <MyApp />
    </PicoBaseProvider>
  )
}
```

### Drop-in auth

```tsx
import { AuthForm } from '@picobase/react'

function LoginPage() {
  return <AuthForm providers={['google', 'github']} redirectTo="/dashboard" />
}
```

### Query data with hooks

```tsx
import { useCollection } from '@picobase/react'

function PostsList() {
  const { items, loading } = useCollection('posts', { sort: '-created' })

  if (loading) return <p>Loading...</p>

  return <ul>{items.map(p => <li key={p.id}>{p.title}</li>)}</ul>
}
```

### Realtime subscriptions

```tsx
import { useRealtime } from '@picobase/react'

function Chat() {
  const { items: messages, loading } = useRealtime('messages', { sort: 'created' })

  if (loading) return <p>Loading...</p>

  return <ul>{messages.map(m => <li key={m.id}>{m.text}</li>)}</ul>
}
```

Data stays in sync automatically. No polling, no manual refetching.

---

## Features

| Feature | What it means for you |
|---|---|
| **Zero-config database** | Write data, collections auto-create. No SQL or migrations. |
| **Drop-in auth** | `<AuthForm />` gives you email, password, and OAuth. |
| **Realtime** | `subscribe()` or `useRealtime()` — data updates live. |
| **File storage** | Upload files as record fields. CDN and thumbnails included. |
| **TypeScript-first** | Full autocomplete. Generate types with `picobase typegen`. |
| **AI-friendly** | Simple SDK that Cursor/Windsurf/Claude understand well. |
| **Cold-start handling** | SDK auto-retries with backoff. Your users never see a 503. |
| **Automatic backups** | Point-in-time recovery to Cloudflare R2. |

---

## CLI

```bash
npx picobase login           # authenticate
npx picobase init my-app     # create instance + scaffold project
npx picobase status          # check instance status
npx picobase typegen         # generate TypeScript types from schema
npx picobase logs --follow   # tail instance logs
npx picobase dev             # run PocketBase locally for development
```

---

## Architecture

PicoBase provides managed PocketBase instances with automatic storage backup:

```
Your App  -->  PicoBase SDK  -->  PicoBase Cloud  -->  PocketBase Instance
                                        |
                                  ┌─────┴─────┐
                                  │  Turso DB  │  (metadata)
                                  │  R2 Storage│  (backups)
                                  └────────────┘
```

### Tech Stack

- **SDK**: `@picobase/client` (TypeScript, wraps PocketBase SDK)
- **React**: `@picobase/react` (Provider, hooks, AuthForm)
- **CLI**: `picobase` (init, deploy, typegen)
- **Platform**: Next.js 14, Turso, Cloudflare R2
- **BaaS Engine**: PocketBase (SQLite, auth, realtime, file storage)

---

## Self-Hosting / Development

If you want to run the platform itself:

### Prerequisites

- Node.js 18+
- PocketBase binary ([download](https://pocketbase.io/docs/))
- Turso account ([sign up](https://turso.tech/))
- Cloudflare R2 bucket

### Setup

```bash
git clone <your-repo-url>
cd picobase
npm install
cp .env.example .env.local
# Fill in your Turso, R2, and auth credentials
npm run db:migrate
npm run dev
```

See `.env.example` for the full list of required environment variables.

---

## Contributing

Contributions are welcome. Please open an issue or PR.

## License

MIT License
