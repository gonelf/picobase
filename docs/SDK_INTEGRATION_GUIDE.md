# PicoBase SDK Integration Guide

A step-by-step guide for adding PicoBase to your project. No backend experience
required — if you can copy and paste code, you can follow along.

---

## Table of Contents

1. [What You Get](#what-you-get)
2. [Before You Start](#before-you-start)
3. [Step 1 — Install the SDK](#step-1--install-the-sdk)
4. [Step 2 — Create Your Client](#step-2--create-your-client)
5. [Step 3 — Add User Authentication](#step-3--add-user-authentication)
   - [Option A: Drop-in Auth Form (fastest)](#option-a-drop-in-auth-form-fastest)
   - [Option B: Build Your Own Login Form](#option-b-build-your-own-login-form)
   - [Option C: Add "Sign in with Google" (OAuth)](#option-c-add-sign-in-with-google-oauth)
6. [Step 4 — Protect Pages Based on Login State](#step-4--protect-pages-based-on-login-state)
7. [Step 5 — Read and Write Data](#step-5--read-and-write-data)
8. [Step 6 — Upload Files](#step-6--upload-files)
9. [Step 7 — Listen for Live Updates](#step-7--listen-for-live-updates)
10. [Full Working Example](#full-working-example)
11. [Common Mistakes](#common-mistakes)
12. [Next Steps](#next-steps)

---

## What You Get

PicoBase gives your app a complete backend with four building blocks:

| Building block | What it does |
|---|---|
| **Auth** | Sign up, sign in, sign out, password reset, Google/GitHub login |
| **Database** | Store, read, update, and delete data (called "collections") |
| **Storage** | Upload and serve files (images, PDFs, etc.) |
| **Realtime** | Get instant updates when data changes (no refreshing) |

You don't need to build any of this yourself. Install the SDK, connect it, and
start using it.

---

## Before You Start

You need two things from the [PicoBase dashboard](https://picobase.com/dashboard):

1. **Your instance URL** — looks like `https://myapp.picobase.com`
2. **Your API key** — starts with `pbk_` (e.g. `pbk_abc12345_xxxxxxxxxxxxxxxx`)

To get these:

1. Sign in at the PicoBase dashboard
2. Click **Create Instance** and give it a name
3. Once created, click into your instance
4. Click **Create API Key** and copy it somewhere safe — it is only shown once

You also need [Node.js](https://nodejs.org/) installed on your computer (version
18 or newer). If you're using a framework like Next.js, Vite, or Create React
App, you already have it.

---

## Step 1 — Install the SDK

Open your terminal, navigate to your project folder, and run:

```bash
npm install @picobase_app/client
```

If you're using **React**, also install the React helpers:

```bash
npm install @picobase_app/client @picobase_app/react
```

That's it. Two packages, one install command.

---

## Step 2 — Create Your Client

The "client" is the object you use to talk to PicoBase. You create it once and
use it everywhere.

### For any JavaScript/TypeScript project

Create a file called `picobase.ts` (or `picobase.js`) wherever you keep your
utility files:

```typescript
// src/lib/picobase.ts

import { createClient } from '@picobase_app/client'

const pb = createClient(
  'https://myapp.picobase.com',   // <-- replace with your URL
  'pbk_abc12345_xxxxxxxxxxxxxxxx' // <-- replace with your API key
)

export default pb
```

### For React projects (recommended)

Instead of importing the client everywhere, wrap your app with the
`PicoBaseProvider`. This gives every component access to PicoBase through hooks.

```tsx
// src/main.tsx  (or App.tsx, index.tsx — wherever your app starts)

import { PicoBaseProvider } from '@picobase_app/react'

function App() {
  return (
    <PicoBaseProvider
      url="https://myapp.picobase.com"
      apiKey="pbk_abc12345_xxxxxxxxxxxxxxxx"
    >
      {/* Everything inside here can use PicoBase hooks */}
      <YourApp />
    </PicoBaseProvider>
  )
}
```

### Keep your API key out of your code (optional but recommended)

Store your URL and key in a `.env` file so they don't end up in git:

```bash
# .env.local  (create this file in your project root)
VITE_PICOBASE_URL=https://myapp.picobase.com
VITE_PICOBASE_API_KEY=pbk_abc12345_xxxxxxxxxxxxxxxx
```

Then reference them in your code:

```typescript
// Vite projects
const pb = createClient(
  import.meta.env.VITE_PICOBASE_URL,
  import.meta.env.VITE_PICOBASE_API_KEY
)

// Next.js projects
const pb = createClient(
  process.env.NEXT_PUBLIC_PICOBASE_URL!,
  process.env.NEXT_PUBLIC_PICOBASE_API_KEY!
)
```

For Next.js, name the variables with a `NEXT_PUBLIC_` prefix instead of `VITE_`.

---

## Step 3 — Add User Authentication

Pick the approach that fits your project.

### Option A: Drop-in Auth Form (fastest)

If you just want a working login/signup form with no extra work, use the
`AuthForm` component. It handles everything — email/password fields, form
validation, error messages, and OAuth buttons.

```tsx
import { AuthForm } from '@picobase_app/react'

function LoginPage() {
  return (
    <AuthForm
      providers={['google', 'github']}
      onSuccess={(user) => {
        console.log('Logged in as', user.email)
        window.location.href = '/dashboard'
      }}
    />
  )
}
```

**What you can customize:**

| Prop | What it does | Default |
|---|---|---|
| `mode` | Start on sign-in or sign-up | `'signIn'` |
| `providers` | OAuth buttons to show | `[]` (none) |
| `redirectTo` | URL to go to after login | none |
| `onSuccess` | Function called after login works | none |
| `onError` | Function called if login fails | none |
| `showForgotPassword` | Show "Forgot password?" link | `true` |
| `labels` | Change any text in the form | English defaults |

### Option B: Build Your Own Login Form

If you want full control over how the form looks, use the `useAuth` hook.

#### Sign-up form

```tsx
import { useState } from 'react'
import { useAuth } from '@picobase_app/react'

function SignUpForm() {
  const { signUp } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    try {
      await signUp(email, password)
      // User is now signed in — redirect or update UI
      window.location.href = '/dashboard'
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <h2>Create Account</h2>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />

      <input
        type="password"
        placeholder="Password (8+ characters)"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        minLength={8}
        required
      />

      <button type="submit">Sign Up</button>
    </form>
  )
}
```

#### Sign-in form

```tsx
import { useState } from 'react'
import { useAuth } from '@picobase_app/react'

function SignInForm() {
  const { signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    try {
      await signIn(email, password)
      window.location.href = '/dashboard'
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <h2>Sign In</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}

      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />

      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />

      <button type="submit">Sign In</button>
    </form>
  )
}
```

#### Sign out

```tsx
import { useAuth } from '@picobase_app/react'

function SignOutButton() {
  const { signOut } = useAuth()

  return <button onClick={signOut}>Sign Out</button>
}
```

#### Password reset

```tsx
import { useAuth } from '@picobase_app/react'

function ForgotPasswordForm() {
  const { requestPasswordReset } = useAuth()
  const [sent, setSent] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    const email = e.target.email.value
    await requestPasswordReset(email)
    setSent(true)
  }

  if (sent) return <p>Check your email for a reset link.</p>

  return (
    <form onSubmit={handleSubmit}>
      <input name="email" type="email" placeholder="Email" required />
      <button type="submit">Send Reset Link</button>
    </form>
  )
}
```

### Option C: Add "Sign in with Google" (OAuth)

First, enable the OAuth provider in your PicoBase dashboard under **Auth
Settings**. Then add a button:

```tsx
import { useAuth } from '@picobase_app/react'

function OAuthButtons() {
  const { signInWithOAuth } = useAuth()

  return (
    <div>
      <button onClick={() => signInWithOAuth('google')}>
        Sign in with Google
      </button>

      <button onClick={() => signInWithOAuth('github')}>
        Sign in with GitHub
      </button>

      <button onClick={() => signInWithOAuth('discord')}>
        Sign in with Discord
      </button>
    </div>
  )
}
```

Supported providers: `google`, `github`, `discord`, `microsoft`, `apple`,
`twitter`.

### Without React (vanilla JS)

If you're not using React, use the client directly:

```typescript
import pb from './lib/picobase'

// Sign up
const { token, record } = await pb.auth.signUp({
  email: 'user@example.com',
  password: 'securepassword',
})
console.log('Signed up:', record.email)

// Sign in
const { token, record } = await pb.auth.signIn({
  email: 'user@example.com',
  password: 'securepassword',
})

// Check who's logged in
const currentUser = pb.auth.user  // null if not logged in

// Sign out
pb.auth.signOut()

// Listen for auth changes
pb.auth.onStateChange((event, record) => {
  if (event === 'SIGNED_IN') {
    console.log('Welcome,', record.email)
  }
  if (event === 'SIGNED_OUT') {
    console.log('User signed out')
  }
})
```

---

## Step 4 — Protect Pages Based on Login State

Show different content depending on whether the user is logged in.

### React

```tsx
import { useAuth } from '@picobase_app/react'

function App() {
  const { user, loading } = useAuth()

  // Still checking if user is logged in — show a spinner
  if (loading) return <p>Loading...</p>

  // Not logged in — show the login page
  if (!user) return <LoginPage />

  // Logged in — show the app
  return (
    <div>
      <p>Welcome, {user.email}!</p>
      <Dashboard />
    </div>
  )
}
```

### Vanilla JS

```typescript
import pb from './lib/picobase'

if (pb.auth.user) {
  // User is logged in
  showDashboard()
} else {
  // User is not logged in
  showLoginForm()
}
```

---

## Step 5 — Read and Write Data

"Collections" are like database tables. You create them in the PicoBase
dashboard, then read/write from your code.

### Create a record

```typescript
const newPost = await pb.collection('posts').create({
  title: 'My First Post',
  content: 'Hello world!',
  published: true,
})

console.log('Created:', newPost.id)
```

### Get a list of records

```typescript
const result = await pb.collection('posts').getList(1, 20, {
  filter: 'published = true',
  sort: '-created',       // newest first (- means descending)
})

console.log(result.items)      // array of posts
console.log(result.totalItems) // total count
```

> **Need more filter examples?** See the full
> [Filter Syntax Reference](./FILTER_SYNTAX.md) for 20+ copy-paste examples
> covering comparisons, string matching, dates, relations, sorting, and more.

### Get a single record

```typescript
const post = await pb.collection('posts').getOne('RECORD_ID_HERE')
console.log(post.title)
```

### Update a record

```typescript
await pb.collection('posts').update('RECORD_ID_HERE', {
  title: 'Updated Title',
})
```

### Delete a record

```typescript
await pb.collection('posts').delete('RECORD_ID_HERE')
```

### React shortcut: useCollection hook

The `useCollection` hook fetches data and gives you loading/error states
automatically:

```tsx
import { useCollection } from '@picobase_app/react'

function PostList() {
  const { items, loading, error } = useCollection('posts', {
    sort: '-created',
    filter: 'published = true',
  })

  if (loading) return <p>Loading posts...</p>
  if (error) return <p>Error: {error.message}</p>

  return (
    <ul>
      {items.map(post => (
        <li key={post.id}>{post.title}</li>
      ))}
    </ul>
  )
}
```

---

## Step 6 — Upload Files

Files are attached to records. Add a file field to your collection in the
dashboard, then upload like this:

### Upload

```typescript
// Get the file from an <input type="file"> element
const fileInput = document.querySelector('input[type="file"]')

const formData = new FormData()
formData.append('title', 'My photo')
formData.append('image', fileInput.files[0])  // "image" is the field name

const record = await pb.collection('posts').create(formData)
```

### Get the file URL

```typescript
const record = await pb.collection('posts').getOne('RECORD_ID_HERE')

// Full-size image
const url = pb.storage.getFileUrl(record, 'photo.jpg')

// Thumbnail (100x100 pixels)
const thumbUrl = pb.storage.getFileUrl(record, 'photo.jpg', {
  thumb: '100x100',
})
```

### React example

```tsx
import { useState } from 'react'
import { useClient } from '@picobase_app/react'

function PhotoUpload() {
  const client = useClient()
  const [file, setFile] = useState(null)

  async function handleUpload() {
    if (!file) return

    const formData = new FormData()
    formData.append('title', 'My photo')
    formData.append('image', file)

    await client.collection('posts').create(formData)
    alert('Uploaded!')
  }

  return (
    <div>
      <input type="file" onChange={(e) => setFile(e.target.files[0])} />
      <button onClick={handleUpload}>Upload</button>
    </div>
  )
}
```

---

## Step 7 — Listen for Live Updates

Realtime subscriptions let your app update instantly when data changes — no
polling, no refreshing.

```typescript
// Watch for any changes to the "messages" collection
const unsubscribe = await pb.collection('messages').subscribe((event) => {
  if (event.action === 'create') {
    console.log('New message:', event.record)
  }
  if (event.action === 'update') {
    console.log('Message updated:', event.record)
  }
  if (event.action === 'delete') {
    console.log('Message deleted:', event.record)
  }
})

// To stop listening:
await unsubscribe()
```

### React example — live chat

```tsx
import { useEffect, useState } from 'react'
import { useClient } from '@picobase_app/react'

function LiveChat() {
  const client = useClient()
  const [messages, setMessages] = useState([])

  useEffect(() => {
    // Load existing messages
    client.collection('messages').getFullList({ sort: 'created' })
      .then(setMessages)

    // Subscribe to new messages
    let unsub
    client.collection('messages').subscribe((event) => {
      if (event.action === 'create') {
        setMessages(prev => [...prev, event.record])
      }
    }).then(fn => { unsub = fn })

    return () => { unsub?.() }
  }, [client])

  return (
    <ul>
      {messages.map(msg => (
        <li key={msg.id}>{msg.text}</li>
      ))}
    </ul>
  )
}
```

---

## Full Working Example

Here's a complete React app with auth and data — ready to copy into your
project:

```tsx
// src/App.tsx

import { PicoBaseProvider, useAuth, useCollection, AuthForm } from '@picobase_app/react'

const URL = import.meta.env.VITE_PICOBASE_URL
const KEY = import.meta.env.VITE_PICOBASE_API_KEY

export default function App() {
  return (
    <PicoBaseProvider url={URL} apiKey={KEY}>
      <Main />
    </PicoBaseProvider>
  )
}

function Main() {
  const { user, loading, signOut } = useAuth()

  if (loading) return <p>Loading...</p>

  if (!user) {
    return (
      <div style={{ maxWidth: 400, margin: '100px auto' }}>
        <AuthForm
          providers={['google']}
          onSuccess={() => window.location.reload()}
        />
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 600, margin: '40px auto' }}>
      <h1>Welcome, {user.email}</h1>
      <button onClick={signOut}>Sign Out</button>
      <hr />
      <PostsList />
    </div>
  )
}

function PostsList() {
  const { items, loading, error } = useCollection('posts', {
    sort: '-created',
    filter: 'published = true',
  })

  if (loading) return <p>Loading posts...</p>
  if (error) return <p>Error: {error.message}</p>
  if (items.length === 0) return <p>No posts yet.</p>

  return (
    <ul>
      {items.map(post => (
        <li key={post.id}>
          <strong>{post.title}</strong>
          <p>{post.content}</p>
        </li>
      ))}
    </ul>
  )
}
```

```bash
# .env.local
VITE_PICOBASE_URL=https://myapp.picobase.com
VITE_PICOBASE_API_KEY=pbk_abc12345_xxxxxxxxxxxxxxxx
```

---

## Common Mistakes

### "usePicoBase* hooks must be used within a PicoBaseProvider"

Your component is not inside the `<PicoBaseProvider>`. Make sure the provider
wraps your entire app or at least the part that uses PicoBase hooks.

```tsx
// Wrong — hook is outside the provider
function App() {
  const { user } = useAuth()  // This will crash
  return <PicoBaseProvider url="..." apiKey="...">...</PicoBaseProvider>
}

// Right — hook is inside the provider
function App() {
  return (
    <PicoBaseProvider url="..." apiKey="...">
      <Inner />
    </PicoBaseProvider>
  )
}

function Inner() {
  const { user } = useAuth()  // This works
  return <p>{user?.email}</p>
}
```

### "Instance unavailable after 3 retries"

Your PicoBase instance might be stopped. Go to the dashboard and start it.
If it was recently stopped, the SDK automatically retries (up to 3 times with
a short wait between tries), but if the instance doesn't come up in time you'll
see this error.

### "Invalid API key"

Double-check that:
- You copied the full key (it starts with `pbk_`)
- You're using the key for the correct instance
- The key hasn't been deleted from the dashboard

### Forgetting `await`

Most PicoBase calls are asynchronous. If you forget `await`, you'll get a
Promise object instead of your data:

```typescript
// Wrong
const posts = pb.collection('posts').getList(1, 20)
console.log(posts) // Promise { <pending> }

// Right
const posts = await pb.collection('posts').getList(1, 20)
console.log(posts.items) // [{ id: '...', title: '...' }, ...]
```

### Environment variables not loading

**Common causes:**

- **Vite**: Variables must start with `VITE_`. Restart the dev server after
  changing `.env` files.
- **Next.js**: Variables must start with `NEXT_PUBLIC_` to be available in the
  browser. Restart the dev server after changes.
- **Create React App**: Variables must start with `REACT_APP_`.

**Using the wrong variable names:**

```bash
# ❌ WRONG - These don't exist
PICOBASE_ADMIN_EMAIL=your-admin-email
PICOBASE_ADMIN_PASSWORD=your-admin-password
PICOBASE_SECRET=pbk_abc12345_xxxxxxxxxxxxxxxx
picobase_url=https://myapp.picobase.com
picobase_secret=pbk_abc12345_xxxxxxxxxxxxxxxx

# ✅ CORRECT
PICOBASE_URL=https://myapp.picobase.com
PICOBASE_API_KEY=pbk_abc12345_xxxxxxxxxxxxxxxx
# or for Next.js
NEXT_PUBLIC_PICOBASE_URL=https://myapp.picobase.com
NEXT_PUBLIC_PICOBASE_API_KEY=pbk_abc12345_xxxxxxxxxxxxxxxx
# or for Vite
VITE_PICOBASE_URL=https://myapp.picobase.com
VITE_PICOBASE_API_KEY=pbk_abc12345_xxxxxxxxxxxxxxxx
```

**Using platform URL instead of instance URL:**

```bash
# ❌ WRONG - Platform URL (where you manage instances)
NEXT_PUBLIC_PICOBASE_URL=https://picobase.app

# ✅ CORRECT - Instance URL (where your data lives)
NEXT_PUBLIC_PICOBASE_URL=https://myapp.picobase.com
```

See the complete [Environment Variables Guide](./ENVIRONMENT_VARIABLES.md) for more details.

---

## Typed Collections (no more magic strings)

Run `picobase typegen` to generate TypeScript types from your collection
schemas. The generated file includes a pre-configured typed client:

```bash
picobase typegen
# Output: ./src/types/picobase.ts
```

Then import and use it — collection names autocomplete, record fields are typed:

```typescript
import { pb } from './src/types/picobase'

// Collection names autocomplete here
const result = await pb.collection('posts').getList(1, 20, {
  filter: 'published = true',
})

// Record fields are typed
result.items[0].title    // string
result.items[0].published // boolean
```

Run `picobase typegen` again whenever you change your collection schemas.

---

## Error Handling

SDK errors include actionable fix suggestions so you never have to Google an
error code:

```typescript
import { PicoBaseError, CollectionNotFoundError } from '@picobase_app/client'

try {
  await pb.collection('psots').getList()  // typo!
} catch (err) {
  if (err instanceof PicoBaseError) {
    console.log(err.message)  // Collection "psots" not found.
    console.log(err.code)     // COLLECTION_NOT_FOUND
    console.log(err.fix)      // Make sure the collection "psots" exists...
  }
}
```

**Error types and their codes:**

| Error | Code | Fix hint |
|---|---|---|
| `ConfigurationError` | `CONFIGURATION_ERROR` | Tells you which env var is missing and how to set it |
| `AuthorizationError` | `UNAUTHORIZED` | Reminds you keys start with `pbk_`, links to dashboard |
| `CollectionNotFoundError` | `COLLECTION_NOT_FOUND` | Explains auto-creation and how to create in dashboard |
| `RecordNotFoundError` | `RECORD_NOT_FOUND` | Explains ID format |
| `InstanceUnavailableError` | `INSTANCE_UNAVAILABLE` | Suggests checking status or restarting |
| `RequestError` | `REQUEST_FAILED` | Status-specific hints (400: check fields, 403: check rules, 429: add delay) |

---

## Local Development

Start both PocketBase and your app dev server in one command:

```bash
picobase dev --with-app
```

This starts PocketBase on `http://127.0.0.1:8090` and runs `npm run dev` with
`PICOBASE_URL` automatically injected. Use `--run "vite"` for a custom command.

---

## Next Steps

- **Create collections** in the dashboard to define your data structure
- **Set up collection rules** to control who can read/write data
- **Enable OAuth providers** in your instance's auth settings
- **Generate typed collections** with `picobase typegen` for full autocomplete
- **Learn the filter syntax** — see the
  [Filter Syntax Reference](./FILTER_SYNTAX.md) for 20+ copy-paste examples
- **Migrating from Supabase or Firebase?** — see the
  [Migration Guide](./MIGRATION_GUIDE.md) for side-by-side code comparisons
- **Use AI tools** — the project includes `CLAUDE.md` and `.cursorrules` so
  Cursor, Claude, and Windsurf understand your PicoBase project
- **Read the full API reference** in the
  [@picobase/client README](https://github.com/picobase/picobase/tree/main/packages/client)

---

## Quick Reference

```typescript
import { createClient } from '@picobase_app/client'
const pb = createClient(url, apiKey)

// Auth
await pb.auth.signUp({ email, password })
await pb.auth.signIn({ email, password })
await pb.auth.signInWithOAuth({ provider: 'google' })
await pb.auth.requestPasswordReset(email)
pb.auth.signOut()
pb.auth.user         // current user or null
pb.auth.isValid      // true if logged in
pb.auth.onStateChange((event, record) => { ... })

// Database
await pb.collection('x').getList(page, perPage, { filter, sort, expand })
await pb.collection('x').getOne(id)
await pb.collection('x').getFirstListItem(filter)
await pb.collection('x').getFullList({ filter, sort })
await pb.collection('x').create(data)
await pb.collection('x').update(id, data)
await pb.collection('x').delete(id)

// Realtime
const unsub = await pb.collection('x').subscribe(callback)
await unsub()

// Storage
pb.storage.getFileUrl(record, filename)
pb.storage.getFileUrl(record, filename, { thumb: '100x100' })

// Error handling — every error has a .fix suggestion
try { ... } catch (err) {
  if (err instanceof PicoBaseError) {
    console.log(err.fix) // actionable fix suggestion
  }
}
```

---

## Step 8 — Admin Operations (Advanced)

If you have an **Admin API Key**, you can manage collections programmatically.
This is useful for migration scripts, CI/CD pipelines, or dynamic schema
generation.

> **Warning:** Admin API keys have full access to modify your instance's
> structure. **Never** expose them in client-side code (browsers). Use them only in
> server-side environments (Node.js, edge functions, etc.).

### Create a Collection

```typescript
import { createClient } from '@picobase_app/client'

// Initialize with an Admin API Key
const pb = createClient('https://myapp.picobase.com', 'pbk_admin_secret...')

// Define a new "products" collection
await pb.admin.createCollection({
  name: 'products',
  type: 'base',
  schema: [
    { name: 'name', type: 'text', required: true },
    { name: 'price', type: 'number', required: true },
    { name: 'in_stock', type: 'bool', options: {} },
  ],
})

console.log('Collection created!')
```

### List & Update

```typescript
// List all collections
const collections = await pb.admin.listCollections()

// Update schema
await pb.admin.updateCollection('products', {
  schema: [
    { name: 'name', type: 'text', required: true },
    { name: 'price', type: 'number', required: true },
    { name: 'in_stock', type: 'bool', options: {} },
    { name: 'description', type: 'text', options: {} }, // New field
  ],
})
```

