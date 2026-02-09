# Migration Guide: Switch to PicoBase

Side-by-side code comparisons to migrate from Supabase or Firebase to PicoBase.
Most migrations take under 10 minutes — the API surface is smaller and simpler.

---

## Table of Contents

1. [From Supabase](#from-supabase)
   - [Setup](#supabase-setup)
   - [Authentication](#supabase-authentication)
   - [CRUD Operations](#supabase-crud-operations)
   - [Realtime](#supabase-realtime)
   - [Storage](#supabase-storage)
   - [Row-Level Security](#supabase-row-level-security)
   - [Environment Variables](#supabase-environment-variables)
2. [From Firebase](#from-firebase)
   - [Setup](#firebase-setup)
   - [Authentication](#firebase-authentication)
   - [CRUD Operations](#firebase-crud-operations)
   - [Realtime](#firebase-realtime)
   - [Storage](#firebase-storage)
   - [Security Rules](#firebase-security-rules)
   - [Environment Variables](#firebase-environment-variables)
3. [Concept Mapping](#concept-mapping)
4. [What You Gain](#what-you-gain)

---

## From Supabase

### Supabase Setup

**Before (Supabase):**

```typescript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
```

**After (PicoBase):**

```typescript
import { createClient } from '@picobase_app/client'

const pb = createClient(
  process.env.NEXT_PUBLIC_PICOBASE_URL!,
  process.env.NEXT_PUBLIC_PICOBASE_API_KEY!
)
```

Or use zero-config (reads from environment automatically):

```typescript
import { createClient } from '@picobase_app/client'

const pb = createClient()
```

### Supabase Authentication

#### Sign up

```typescript
// Supabase
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'password123',
})

// PicoBase
const { token, record } = await pb.auth.signUp({
  email: 'user@example.com',
  password: 'password123',
})
```

#### Sign in

```typescript
// Supabase
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password123',
})

// PicoBase
const { token, record } = await pb.auth.signIn({
  email: 'user@example.com',
  password: 'password123',
})
```

#### Sign out

```typescript
// Supabase
await supabase.auth.signOut()

// PicoBase
pb.auth.signOut()
```

#### Get current user

```typescript
// Supabase
const { data: { user } } = await supabase.auth.getUser()

// PicoBase
const user = pb.auth.user
```

#### OAuth

```typescript
// Supabase
await supabase.auth.signInWithOAuth({ provider: 'google' })

// PicoBase
await pb.auth.signInWithOAuth({ provider: 'google' })
```

#### Password reset

```typescript
// Supabase
await supabase.auth.resetPasswordForEmail('user@example.com')

// PicoBase
await pb.auth.requestPasswordReset('user@example.com')
```

#### Auth state listener

```typescript
// Supabase
supabase.auth.onAuthStateChange((event, session) => {
  console.log(event, session?.user)
})

// PicoBase
pb.auth.onStateChange((event, record) => {
  console.log(event, record)
})
```

### Supabase CRUD Operations

#### Read — get a list

```typescript
// Supabase
const { data, error } = await supabase
  .from('posts')
  .select('*')
  .eq('published', true)
  .order('created_at', { ascending: false })
  .range(0, 19)

// PicoBase
const result = await pb.collection('posts').getList(1, 20, {
  filter: 'published = true',
  sort: '-created',
})
// result.items, result.totalItems, result.totalPages
```

#### Read — get one record

```typescript
// Supabase
const { data, error } = await supabase
  .from('posts')
  .select('*')
  .eq('id', postId)
  .single()

// PicoBase
const post = await pb.collection('posts').getOne(postId)
```

#### Read — with filters

```typescript
// Supabase
const { data } = await supabase
  .from('posts')
  .select('*')
  .eq('status', 'active')
  .gte('created_at', '2024-01-01')
  .ilike('title', '%hello%')

// PicoBase
const result = await pb.collection('posts').getList(1, 20, {
  filter: 'status = "active" && created >= "2024-01-01" && title ~ "hello"',
})
```

#### Read — with relations (joins)

```typescript
// Supabase
const { data } = await supabase
  .from('posts')
  .select('*, author:users(*), comments(*)')

// PicoBase
const result = await pb.collection('posts').getList(1, 20, {
  expand: 'author,comments',
})
// Access via result.items[0].expand?.author
```

#### Create

```typescript
// Supabase
const { data, error } = await supabase
  .from('posts')
  .insert({ title: 'Hello', content: 'World', published: true })
  .select()
  .single()

// PicoBase
const post = await pb.collection('posts').create({
  title: 'Hello',
  content: 'World',
  published: true,
})
```

#### Update

```typescript
// Supabase
const { data, error } = await supabase
  .from('posts')
  .update({ title: 'Updated' })
  .eq('id', postId)
  .select()
  .single()

// PicoBase
const post = await pb.collection('posts').update(postId, {
  title: 'Updated',
})
```

#### Delete

```typescript
// Supabase
const { error } = await supabase
  .from('posts')
  .delete()
  .eq('id', postId)

// PicoBase
await pb.collection('posts').delete(postId)
```

### Supabase Realtime

```typescript
// Supabase
const channel = supabase
  .channel('posts')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'posts',
  }, (payload) => {
    console.log(payload.eventType, payload.new)
  })
  .subscribe()

// Unsubscribe
channel.unsubscribe()

// PicoBase
const unsub = await pb.collection('posts').subscribe((event) => {
  console.log(event.action, event.record) // 'create' | 'update' | 'delete'
})

// Unsubscribe
await unsub()
```

### Supabase Storage

```typescript
// Supabase — upload
const { data, error } = await supabase.storage
  .from('avatars')
  .upload('public/avatar.png', file)

// Supabase — get URL
const { data } = supabase.storage
  .from('avatars')
  .getPublicUrl('public/avatar.png')

// PicoBase — upload (files are attached to records)
const formData = new FormData()
formData.append('avatar', file)
await pb.collection('users').update(userId, formData)

// PicoBase — get URL
const url = pb.storage.getFileUrl(record, 'avatar.png')
const thumbUrl = pb.storage.getFileUrl(record, 'avatar.png', { thumb: '100x100' })
```

### Supabase Row-Level Security

Supabase uses PostgreSQL RLS policies written in SQL. PicoBase uses API rules
configured in the dashboard — no SQL required.

```sql
-- Supabase RLS: Users can only read their own records
CREATE POLICY "Users read own data"
  ON posts FOR SELECT
  USING (auth.uid() = user_id);

-- Supabase RLS: Users can only insert their own records
CREATE POLICY "Users insert own data"
  ON posts FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

**PicoBase equivalent** (set in the dashboard under Collection > API Rules):

| Rule | Value |
|------|-------|
| List/Search | `@request.auth.id = user` |
| View | `@request.auth.id = user` |
| Create | `@request.auth.id != ""` |
| Update | `@request.auth.id = user` |
| Delete | `@request.auth.id = user` |

No SQL, no migrations. Change rules in the dashboard and they apply immediately.

### Supabase Environment Variables

| Supabase | PicoBase |
|----------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | `NEXT_PUBLIC_PICOBASE_URL` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `NEXT_PUBLIC_PICOBASE_API_KEY` |
| `SUPABASE_SERVICE_ROLE_KEY` | (not needed — use API rules instead) |

For Vite projects, replace `NEXT_PUBLIC_` with `VITE_`.

---

## From Firebase

### Firebase Setup

**Before (Firebase):**

```typescript
import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'

const app = initializeApp({
  apiKey: '...',
  authDomain: '...',
  projectId: '...',
  storageBucket: '...',
  messagingSenderId: '...',
  appId: '...',
})

const db = getFirestore(app)
const auth = getAuth(app)
```

**After (PicoBase):**

```typescript
import { createClient } from '@picobase_app/client'

const pb = createClient(
  'https://myapp.picobase.com',
  'pbk_your_api_key'
)
```

Six config values become two.

### Firebase Authentication

#### Sign up

```typescript
// Firebase
import { createUserWithEmailAndPassword } from 'firebase/auth'
const credential = await createUserWithEmailAndPassword(auth, email, password)
const user = credential.user

// PicoBase
const { token, record } = await pb.auth.signUp({ email, password })
```

#### Sign in

```typescript
// Firebase
import { signInWithEmailAndPassword } from 'firebase/auth'
const credential = await signInWithEmailAndPassword(auth, email, password)

// PicoBase
const { token, record } = await pb.auth.signIn({ email, password })
```

#### Sign out

```typescript
// Firebase
import { signOut } from 'firebase/auth'
await signOut(auth)

// PicoBase
pb.auth.signOut()
```

#### Get current user

```typescript
// Firebase
import { getAuth } from 'firebase/auth'
const user = getAuth().currentUser

// PicoBase
const user = pb.auth.user
```

#### OAuth

```typescript
// Firebase
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth'
await signInWithPopup(auth, new GoogleAuthProvider())

// PicoBase
await pb.auth.signInWithOAuth({ provider: 'google' })
```

#### Auth state listener

```typescript
// Firebase
import { onAuthStateChanged } from 'firebase/auth'
onAuthStateChanged(auth, (user) => {
  if (user) console.log('Signed in:', user.email)
  else console.log('Signed out')
})

// PicoBase
pb.auth.onStateChange((event, record) => {
  if (event === 'SIGNED_IN') console.log('Signed in:', record.email)
  if (event === 'SIGNED_OUT') console.log('Signed out')
})
```

### Firebase CRUD Operations

#### Create a document

```typescript
// Firebase
import { collection, addDoc } from 'firebase/firestore'
const docRef = await addDoc(collection(db, 'posts'), {
  title: 'Hello',
  content: 'World',
  published: true,
})

// PicoBase
const post = await pb.collection('posts').create({
  title: 'Hello',
  content: 'World',
  published: true,
})
```

#### Read a single document

```typescript
// Firebase
import { doc, getDoc } from 'firebase/firestore'
const docSnap = await getDoc(doc(db, 'posts', postId))
const post = docSnap.data()

// PicoBase
const post = await pb.collection('posts').getOne(postId)
```

#### Query documents

```typescript
// Firebase
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore'
const q = query(
  collection(db, 'posts'),
  where('published', '==', true),
  where('category', '==', 'tech'),
  orderBy('createdAt', 'desc'),
  limit(20)
)
const snapshot = await getDocs(q)
const posts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))

// PicoBase
const result = await pb.collection('posts').getList(1, 20, {
  filter: 'published = true && category = "tech"',
  sort: '-created',
})
const posts = result.items
```

#### Update a document

```typescript
// Firebase
import { doc, updateDoc } from 'firebase/firestore'
await updateDoc(doc(db, 'posts', postId), {
  title: 'Updated',
})

// PicoBase
await pb.collection('posts').update(postId, {
  title: 'Updated',
})
```

#### Delete a document

```typescript
// Firebase
import { doc, deleteDoc } from 'firebase/firestore'
await deleteDoc(doc(db, 'posts', postId))

// PicoBase
await pb.collection('posts').delete(postId)
```

### Firebase Realtime

```typescript
// Firebase
import { collection, onSnapshot, query, where } from 'firebase/firestore'
const q = query(collection(db, 'messages'), where('room', '==', roomId))
const unsubscribe = onSnapshot(q, (snapshot) => {
  snapshot.docChanges().forEach((change) => {
    if (change.type === 'added') console.log('New:', change.doc.data())
    if (change.type === 'modified') console.log('Updated:', change.doc.data())
    if (change.type === 'removed') console.log('Deleted:', change.doc.data())
  })
})

// PicoBase
const unsub = await pb.collection('messages').subscribe((event) => {
  console.log(event.action, event.record) // 'create' | 'update' | 'delete'
})
```

### Firebase Storage

```typescript
// Firebase
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage'
const storage = getStorage()
const storageRef = ref(storage, 'avatars/user123.png')
await uploadBytes(storageRef, file)
const url = await getDownloadURL(storageRef)

// PicoBase — files are attached to records
const formData = new FormData()
formData.append('avatar', file)
await pb.collection('users').update(userId, formData)
const url = pb.storage.getFileUrl(record, 'avatar.png')
```

### Firebase Security Rules

Firebase uses a custom rules language. PicoBase uses API rules in the dashboard.

```
// Firebase security rules (firestore.rules)
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /posts/{postId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update, delete: if request.auth.uid == resource.data.userId;
    }
  }
}
```

**PicoBase equivalent** (set in dashboard):

| Rule | Value |
|------|-------|
| List/Search | `@request.auth.id != ""` |
| View | `@request.auth.id != ""` |
| Create | `@request.auth.id != ""` |
| Update | `@request.auth.id = user` |
| Delete | `@request.auth.id = user` |

No deploy step. Rules are configured in the dashboard and apply immediately.

### Firebase Environment Variables

| Firebase | PicoBase |
|----------|----------|
| `apiKey` | `PICOBASE_API_KEY` |
| `authDomain` | (not needed) |
| `projectId` | (not needed) |
| `storageBucket` | (not needed) |
| `messagingSenderId` | (not needed) |
| `appId` | (not needed) |

Firebase needs 6 config values. PicoBase needs 2: `PICOBASE_URL` and
`PICOBASE_API_KEY`.

---

## Concept Mapping

| Concept | Supabase | Firebase | PicoBase |
|---------|----------|----------|----------|
| Database | PostgreSQL tables | Firestore documents | Collections |
| Row / Document | Row | Document | Record |
| Schema | SQL migrations | Schemaless | Dashboard or auto-create |
| Auth | `supabase.auth` | `firebase/auth` | `pb.auth` |
| Realtime | Channels | `onSnapshot` | `subscribe()` |
| File storage | Buckets | Cloud Storage | File fields on records |
| Access control | RLS (SQL) | Security Rules | API Rules (dashboard) |
| Client setup | 2 env vars | 6 config values | 2 env vars (or zero-config) |
| TypeScript types | Generated with CLI | Manual | `picobase typegen` |
| Local dev | Docker + CLI | Emulators | `picobase dev` |

---

## What You Gain

1. **Simpler setup** — 2 env vars instead of 6. Zero-config option reads from
   environment automatically.

2. **No SQL** — Collections auto-create on first write. Schema changes happen in
   the dashboard. No migrations to write or run.

3. **No RLS policies** — API rules are configured in the dashboard with a simple
   syntax. No SQL, no deploy step.

4. **Built-in error suggestions** — Every SDK error includes a `.fix` property
   telling you exactly what to do.

5. **One command local dev** — `picobase dev --with-app` starts everything. No
   Docker, no emulators.

6. **AI-ready** — Project includes `CLAUDE.md` and `.cursorrules` so AI tools
   understand your PicoBase setup out of the box.
