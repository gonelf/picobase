# @picobase_app/client

TypeScript SDK for PicoBase — add auth, database, realtime, and file storage to your app.

## Install

```bash
npm install @picobase_app/client
```

## Quickstart

```typescript
import { createClient } from '@picobase_app/client'

const pb = createClient('https://myapp.picobase.com', 'pbk_xxxxxxxx_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx')
```

Get your URL and API key from the [PicoBase dashboard](https://picobase.com/dashboard).

## Authentication

```typescript
// Sign up a new user
const { token, record } = await pb.auth.signUp({
  email: 'user@example.com',
  password: 'securepassword',
  name: 'Jane Doe',
})

// Sign in
const { token, record } = await pb.auth.signIn({
  email: 'user@example.com',
  password: 'securepassword',
})

// OAuth (Google, GitHub, etc. — configure providers in the dashboard)
const { token, record } = await pb.auth.signInWithOAuth({
  provider: 'google',
})

// Check current user
const user = pb.auth.user       // RecordModel | null
const isValid = pb.auth.isValid // boolean

// Listen to auth changes
const unsubscribe = pb.auth.onStateChange((event, record) => {
  // event: 'SIGNED_IN' | 'SIGNED_OUT' | 'TOKEN_REFRESHED'
  console.log(event, record?.email)
})

// Password reset
await pb.auth.requestPasswordReset('user@example.com')

// Sign out
pb.auth.signOut()
```

## Database (Collections)

```typescript
// List records with pagination, filtering, and sorting
const result = await pb.collection('posts').getList(1, 20, {
  filter: 'published = true',
  sort: '-created',
  expand: 'author',
})
// result.items, result.totalItems, result.totalPages

// Get a single record
const post = await pb.collection('posts').getOne('RECORD_ID')

// Find first match
const admin = await pb.collection('users').getFirstListItem('role = "admin"')

// Get all records (auto-paginates — use with caution on large collections)
const allPosts = await pb.collection('posts').getFullList({
  filter: 'published = true',
})

// Create
const newPost = await pb.collection('posts').create({
  title: 'Hello World',
  content: 'My first post',
  published: true,
})

// Update
const updated = await pb.collection('posts').update('RECORD_ID', {
  title: 'Updated Title',
})

// Delete
await pb.collection('posts').delete('RECORD_ID')
```

### TypeScript generics

```typescript
interface Post {
  id: string
  title: string
  content: string
  published: boolean
  created: string
  updated: string
}

const posts = await pb.collection<Post>('posts').getList(1, 20)
// posts.items is Post[]
```

### File uploads

```typescript
const formData = new FormData()
formData.append('title', 'Photo post')
formData.append('image', fileInput.files[0])

const record = await pb.collection('posts').create(formData)
```

## Realtime

```typescript
// Subscribe to all changes on a collection
const unsubscribe = await pb.collection('posts').subscribe((event) => {
  console.log(event.action, event.record) // 'create' | 'update' | 'delete'
})

// Subscribe to a specific record
const unsubscribe = await pb.collection('posts').subscribeOne('RECORD_ID', (event) => {
  console.log(event.action, event.record)
})

// Unsubscribe
await unsubscribe()

// Or use the realtime module directly
const unsub = await pb.realtime.subscribe('posts', (event) => {
  console.log(event)
})

// Disconnect all realtime subscriptions
await pb.realtime.disconnectAll()
```

## File Storage

PocketBase stores files as fields on records. Use the storage module to get URLs.

```typescript
const user = await pb.collection('users').getOne('USER_ID')

// Get file URL
const url = pb.storage.getFileUrl(user, 'avatar.jpg')

// Get thumbnail
const thumb = pb.storage.getFileUrl(user, 'avatar.jpg', { thumb: '100x100' })

// Protected files — get a temporary token first
const token = await pb.storage.getFileToken()
const protectedUrl = pb.storage.getFileUrl(user, 'document.pdf', { token })
```

## Advanced

### Custom auth collection

```typescript
// If you use a custom auth collection instead of 'users'
pb.auth.setCollection('members')
await pb.auth.signIn({ email: 'member@example.com', password: 'pass' })
```

### Raw PocketBase access

The underlying PocketBase SDK instance is exposed for advanced use cases.

```typescript
// Access the PocketBase client directly
const health = await pb.pb.health.check()

// Custom API endpoint
const result = await pb.send('/api/custom-endpoint', { method: 'POST', body: { foo: 'bar' } })
```

### Cold-start handling

PicoBase instances may be paused when idle. The SDK automatically retries with exponential backoff (2s, 4s, 8s) when it receives a 503 response. You can configure this:

```typescript
const pb = createClient('https://myapp.picobase.com', 'pbk_...', {
  maxColdStartRetries: 5,  // default: 3
})
```

### Error handling

Every SDK error includes a `code` and `fix` property with actionable suggestions:

```typescript
import {
  PicoBaseError,
  AuthorizationError,
  InstanceUnavailableError,
  CollectionNotFoundError,
  RecordNotFoundError,
  ConfigurationError,
} from '@picobase_app/client'

try {
  await pb.collection('posts').getList()
} catch (err) {
  if (err instanceof PicoBaseError) {
    console.log(err.message)  // "Collection 'posts' not found."
    console.log(err.code)     // "COLLECTION_NOT_FOUND"
    console.log(err.fix)      // "Make sure the collection 'posts' exists..."
  }
}
```

**Error types:**

| Error | Code | When |
|---|---|---|
| `ConfigurationError` | `CONFIGURATION_ERROR` | Missing URL, API key, or bad config |
| `AuthorizationError` | `UNAUTHORIZED` | Invalid or missing API key |
| `CollectionNotFoundError` | `COLLECTION_NOT_FOUND` | Collection doesn't exist |
| `RecordNotFoundError` | `RECORD_NOT_FOUND` | Record ID not found |
| `InstanceUnavailableError` | `INSTANCE_UNAVAILABLE` | Instance down after retries |
| `RequestError` | `REQUEST_FAILED` | Generic HTTP error (includes status-specific fix hints) |

### Typed collections with `picobase typegen`

Run `picobase typegen` to generate types from your schema. The generated file includes a typed client:

```typescript
import { pb } from './src/types/picobase'

// Collection names autocomplete, record fields are typed
const result = await pb.collection('posts').getList(1, 20)
result.items[0].title  // string — fully typed!
```

## API Reference

### `createClient(url, apiKey, options?)`

| Parameter | Type | Description |
|---|---|---|
| `url` | `string` | Your PicoBase instance URL |
| `apiKey` | `string` | API key from the dashboard (starts with `pbk_`) |
| `options.maxColdStartRetries` | `number` | Max retries on 503. Default: `3` |
| `options.lang` | `string` | Accept-Language header. Default: `'en-US'` |

### Modules

| Module | Access | Description |
|---|---|---|
| `pb.auth` | `PicoBaseAuth` | Sign up, sign in, OAuth, session management |
| `pb.collection(name)` | `PicoBaseCollection` | CRUD operations on a collection |
| `pb.realtime` | `PicoBaseRealtime` | Realtime subscriptions |
| `pb.storage` | `PicoBaseStorage` | File URLs and tokens |
| `pb.pb` | `PocketBase` | Underlying PocketBase SDK instance |
