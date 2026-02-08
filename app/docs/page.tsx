import Link from 'next/link'
import { getAuthUrl } from '@/lib/auth-utils'

export default function DocsPage() {
  const signInUrl = getAuthUrl('signin')

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Navbar */}
      <header className="sticky top-0 z-50 w-full border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div
              className="w-8 h-8 bg-primary-600 dark:bg-primary-400"
              style={{
                maskImage: 'url(/logo.svg)',
                maskSize: 'contain',
                maskPosition: 'center',
                maskRepeat: 'no-repeat',
                WebkitMaskImage: 'url(/logo.svg)',
                WebkitMaskSize: 'contain',
                WebkitMaskPosition: 'center',
                WebkitMaskRepeat: 'no-repeat',
              }}
            />
            <span className="text-gray-900 dark:text-white font-bold text-xl">PicoBase Docs</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              Home
            </Link>
            <Link
              href={signInUrl}
              className="px-4 py-2 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition-all duration-300 text-sm"
            >
              Sign In
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-12 flex flex-col lg:flex-row gap-12">
        {/* Sidebar Navigation */}
        <aside className="hidden lg:block w-64 flex-shrink-0 sticky top-24 h-[calc(100vh-6rem)] overflow-y-auto">
          <h5 className="font-semibold text-gray-900 dark:text-white mb-4 px-2">On this page</h5>
          <nav className="space-y-1">
            <TableOfContentsLink href="#what-you-get">What You Get</TableOfContentsLink>
            <TableOfContentsLink href="#before-you-start">Before You Start</TableOfContentsLink>
            <TableOfContentsLink href="#step-1">Step 1 — Install</TableOfContentsLink>
            <TableOfContentsLink href="#step-2">Step 2 — Create Client</TableOfContentsLink>
            <TableOfContentsLink href="#step-3">Step 3 — Authentication</TableOfContentsLink>
            <TableOfContentsLink href="#step-4">Step 4 — Protect Pages</TableOfContentsLink>
            <TableOfContentsLink href="#step-5">Step 5 — Read/Write Data</TableOfContentsLink>
            <TableOfContentsLink href="#step-6">Step 6 — Upload Files</TableOfContentsLink>
            <TableOfContentsLink href="#step-7">Step 7 — Realtime</TableOfContentsLink>
            <TableOfContentsLink href="#full-example">Full Working Example</TableOfContentsLink>
            <TableOfContentsLink href="#quick-reference">Quick Reference</TableOfContentsLink>
            <TableOfContentsLink href="#common-mistakes">Common Mistakes</TableOfContentsLink>
            <TableOfContentsLink href="#next-steps">Next Steps</TableOfContentsLink>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0 prose prose-lg dark:prose-invert max-w-none">
          <h1 className="text-4xl font-bold mb-4 gradient-text from-primary-600 to-accent-600 dark:from-primary-400 dark:to-accent-400 inline-block">
            PicoBase SDK Integration Guide
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 leading-relaxed font-light">
            A step-by-step guide for adding PicoBase to your project. No backend experience required.
          </p>

          <hr className="my-8 border-gray-200 dark:border-gray-800" />

          <section id="what-you-get" className="scroll-mt-24">
            <h2>What You Get</h2>
            <p>PicoBase gives your app a complete backend with four building blocks:</p>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="py-3 px-4 font-semibold text-gray-900 dark:text-white">Building block</th>
                    <th className="py-3 px-4 font-semibold text-gray-900 dark:text-white">What it does</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  <tr className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="py-3 px-4 font-medium text-primary-600 dark:text-primary-400">Auth</td>
                    <td className="py-3 px-4 text-gray-600 dark:text-gray-300">Sign up, sign in, sign out, password reset, Google/GitHub login</td>
                  </tr>
                  <tr className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="py-3 px-4 font-medium text-primary-600 dark:text-primary-400">Database</td>
                    <td className="py-3 px-4 text-gray-600 dark:text-gray-300">Store, read, update, and delete data (called &quot;collections&quot;)</td>
                  </tr>
                  <tr className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="py-3 px-4 font-medium text-primary-600 dark:text-primary-400">Storage</td>
                    <td className="py-3 px-4 text-gray-600 dark:text-gray-300">Upload and serve files (images, PDFs, etc.)</td>
                  </tr>
                  <tr className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="py-3 px-4 font-medium text-primary-600 dark:text-primary-400">Realtime</td>
                    <td className="py-3 px-4 text-gray-600 dark:text-gray-300">Get instant updates when data changes (no refreshing)</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section id="before-you-start" className="scroll-mt-24 mt-12">
            <h2>Before You Start</h2>
            <p>You need two things from the <a href="https://picobase.app/dashboard" className="text-primary-600 hover:underline">PicoBase dashboard</a>:</p>
            <ol className="list-decimal pl-6 space-y-2 text-gray-700 dark:text-gray-300">
              <li><strong>Your instance URL</strong> — looks like <code>https://myapp.picobase.app</code></li>
              <li><strong>Your API key</strong> — starts with <code>pbk_</code> (e.g. <code>pbk_abc12345_xxxxxxxxxxxxxxxx</code>)</li>
            </ol>
            <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 p-4 my-6 rounded-r-lg">
              <p className="m-0 text-blue-800 dark:text-blue-200 text-sm">
                <strong>To get these:</strong><br />
                1. Sign in at the PicoBase dashboard<br />
                2. Click <strong>Create Instance</strong> and give it a name<br />
                3. Once created, click into your instance<br />
                4. Click <strong>Create API Key</strong> and copy it somewhere safe — it is only shown once
              </p>
            </div>
            <p>You also need <a href="https://nodejs.org/" className="text-primary-600 hover:underline">Node.js</a> installed (version 18 or newer).</p>
          </section>

          <section id="step-1" className="scroll-mt-24 mt-12">
            <h2>Step 1 — Install the SDK</h2>
            <p>Open your terminal, navigate to your project folder, and run:</p>
            <CodeBlock language="bash">npm install @picobase_app/client</CodeBlock>
            <p>If you&apos;re using <strong>React</strong>, also install the React helpers:</p>
            <CodeBlock language="bash">npm install @picobase_app/client @picobase_app/react</CodeBlock>
          </section>

          <section id="step-2" className="scroll-mt-24 mt-12">
            <h2>Step 2 — Create Your Client</h2>
            <p>The &quot;client&quot; is the object you use to talk to PicoBase. You create it once and use it everywhere.</p>

            <h3 className="text-xl font-semibold mt-6 mb-3">For any JavaScript/TypeScript project</h3>
            <p>Create a file called <code>picobase.ts</code> (or <code>picobase.js</code>) wherever you keep your utility files:</p>
            <CodeBlock language="typescript" filename="src/lib/picobase.ts">{`
import { createClient } from '@picobase_app/client'

const pb = createClient(
  'https://myapp.picobase.app',   // <-- replace with your URL
  'pbk_abc12345_xxxxxxxxxxxxxxxx' // <-- replace with your API key
)

export default pb
            `}</CodeBlock>

            <h3 className="text-xl font-semibold mt-8 mb-3">For React projects (recommended)</h3>
            <p>Instead of importing the client everywhere, wrap your app with the <code>PicoBaseProvider</code>. This gives every component access to PicoBase through hooks.</p>
            <CodeBlock language="tsx" filename="src/main.tsx">{`
import { PicoBaseProvider } from '@picobase_app/react'

function App() {
  return (
    <PicoBaseProvider
      url="https://myapp.picobase.app"
      apiKey="pbk_abc12345_xxxxxxxxxxxxxxxx"
    >
      {/* Everything inside here can use PicoBase hooks */}
      <YourApp />
    </PicoBaseProvider>
  )
}
            `}</CodeBlock>

            <h3 className="text-xl font-semibold mt-8 mb-3">Keep your API key out of your code</h3>
            <p className="text-gray-500 italic mb-4">Optional but recommended</p>
            <p>Store your URL and key in a <code>.env</code> file so they don&apos;t end up in git:</p>
            <CodeBlock language="bash" filename=".env.local">{`
VITE_PICOBASE_URL=https://myapp.picobase.app
VITE_PICOBASE_API_KEY=pbk_abc12345_xxxxxxxxxxxxxxxx
            `}</CodeBlock>
            <p className="mt-4">Then reference them in your code:</p>
            <CodeBlock language="typescript">{`
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
            `}</CodeBlock>
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500 p-4 my-4 rounded-r-lg">
              <p className="m-0 text-yellow-800 dark:text-yellow-200 text-sm">
                <strong>Next.js TIP:</strong> Name the variables with a <code>NEXT_PUBLIC_</code> prefix to make them available in the browser.
              </p>
            </div>
          </section>

          <section id="step-3" className="scroll-mt-24 mt-12">
            <h2>Step 3 — Add User Authentication</h2>

            <h3 className="text-xl font-semibold mt-6 mb-3">Option A: Drop-in Auth Form (fastest)</h3>
            <p>Use the <code>AuthForm</code> component for a full login/signup form with zero config.</p>
            <CodeBlock language="tsx">{`
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
            `}</CodeBlock>

            <h3 className="text-xl font-semibold mt-8 mb-3">Option B: Build Your Own Login Form</h3>
            <p>Use the <code>useAuth</code> hook for full control.</p>

            <h4 className="font-medium mt-4">Sign-up form</h4>
            <CodeBlock language="tsx">{`
import { useState } from 'react'
import { useAuth } from '@picobase_app/react'

function SignUpForm() {
  const { signUp } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    await signUp(email, password)
    // Redirect or update UI
  }

  return (
    <form onSubmit={handleSubmit}>
      <input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
      <input type="password" value={password} onChange={e => setPassword(e.target.value)} required />
      <button type="submit">Sign Up</button>
    </form>
  )
}
            `}</CodeBlock>
          </section>

          <section id="step-4" className="scroll-mt-24 mt-12">
            <h2>Step 4 — Protect Pages</h2>
            <p>Show different content depending on whether the user is logged in.</p>
            <CodeBlock language="tsx">{`
import { useAuth } from '@picobase_app/react'

function App() {
  const { user, loading } = useAuth()

  // Still checking if user is logged in
  if (loading) return <p>Loading...</p>

  // Not logged in
  if (!user) return <LoginPage />

  // Logged in
  return (
    <div>
      <p>Welcome, {user.email}!</p>
      <Dashboard />
    </div>
  )
}
            `}</CodeBlock>
          </section>

          <section id="step-5" className="scroll-mt-24 mt-12">
            <h2>Step 5 — Read and Write Data</h2>
            <p>Collections are like database tables. Create them in the dashboard, then use them in code.</p>

            <h3 className="text-xl font-semibold mt-6 mb-3">React shortcut: useCollection hook</h3>
            <p>Fetches data and handles loading/error states automatically.</p>
            <CodeBlock language="tsx">{`
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
            `}</CodeBlock>

            <h3 className="text-xl font-semibold mt-8 mb-3">CRUD Operations (Vanilla JS / Handlers)</h3>
            <CodeBlock language="typescript">{`
// Create
const newPost = await pb.collection('posts').create({
  title: 'My First Post',
  published: true,
})

// Read (List)
const result = await pb.collection('posts').getList(1, 20, {
  sort: '-created',
})

// Update
await pb.collection('posts').update('RECORD_ID', {
  title: 'Updated Title',
})

// Delete
await pb.collection('posts').delete('RECORD_ID')
            `}</CodeBlock>
          </section>

          <section id="step-6" className="scroll-mt-24 mt-12">
            <h2>Step 6 — Upload Files</h2>
            <p>Files are attached to records. Add a file field to your collection in the dashboard first.</p>
            <CodeBlock language="typescript">{`
const formData = new FormData()
formData.append('title', 'My photo')
formData.append('image', fileInput.files[0])

const record = await pb.collection('posts').create(formData)
            `}</CodeBlock>

            <h3 className="text-xl font-semibold mt-6 mb-3">Get the file URL</h3>
            <CodeBlock language="typescript">{`
const url = pb.storage.getFileUrl(record, 'photo.jpg')

// With thumbnail transform
const thumbUrl = pb.storage.getFileUrl(record, 'photo.jpg', {
  thumb: '100x100',
})
            `}</CodeBlock>
          </section>

          <section id="step-7" className="scroll-mt-24 mt-12">
            <h2>Step 7 — Listen for Live Updates</h2>
            <p>Realtime subscriptions let your app update instantly when data changes.</p>
            <CodeBlock language="typescript">{`
// Watch for any changes
const unsubscribe = await pb.collection('messages').subscribe((event) => {
  console.log(event.action) // 'create', 'update', or 'delete'
  console.log(event.record) // the data that changed
})

// Stop listening
await unsubscribe()
            `}</CodeBlock>
          </section>

          <section id="full-example" className="scroll-mt-24 mt-12">
            <h2>Full Working Example</h2>
            <p>A complete React app with auth and data — ready to copy.</p>
            <CodeBlock language="tsx" filename="src/App.tsx">{`
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
            `}</CodeBlock>
          </section>

          <section id="quick-reference" className="scroll-mt-24 mt-12">
            <h2>Quick Reference</h2>
            <CodeBlock language="typescript">{`
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
            `}</CodeBlock>
          </section>

          <section id="common-mistakes" className="scroll-mt-24 mt-12">
            <h2>Common Mistakes</h2>
            <div className="space-y-6">
              <div className="bg-red-50 dark:bg-red-900/10 border-l-4 border-red-500 p-4 rounded-r-lg">
                <h4 className="text-red-800 dark:text-red-200 font-bold m-0 text-base">"usePicoBase* hooks must be used within a PicoBaseProvider"</h4>
                <p className="text-red-700 dark:text-red-300 text-sm mt-2">
                  Make sure <code>&lt;PicoBaseProvider&gt;</code> wraps your entire app or at least the part that uses the hooks.
                </p>
              </div>
              <div className="bg-red-50 dark:bg-red-900/10 border-l-4 border-red-500 p-4 rounded-r-lg">
                <h4 className="text-red-800 dark:text-red-200 font-bold m-0 text-base">"Instance unavailable after 3 retries"</h4>
                <p className="text-red-700 dark:text-red-300 text-sm mt-2">
                  Your PicoBase instance might be stopped. Check the dashboard. The SDK retries automatically, but if it wakes up too slowly, you might see this error.
                </p>
              </div>
              <div className="bg-red-50 dark:bg-red-900/10 border-l-4 border-red-500 p-4 rounded-r-lg">
                <h4 className="text-red-800 dark:text-red-200 font-bold m-0 text-base">Forgetting "await"</h4>
                <p className="text-red-700 dark:text-red-300 text-sm mt-2">
                  Most SDK calls are asynchronous. If you forget <code>await</code>, you get a Promise instead of data.
                </p>
              </div>
            </div>
          </section>

          <section id="next-steps" className="scroll-mt-24 mt-12 mb-20">
            <h2>Next Steps</h2>
            <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300">
              <li><strong>Create collections</strong> in the dashboard to define your data structure</li>
              <li><strong>Set up collection rules</strong> to control who can read/write data</li>
              <li><strong>Enable OAuth providers</strong> in your instance&apos;s auth settings</li>
              <li>Real the full API reference in the <a href="https://github.com/picobase/picobase/tree/main/packages/client" className="text-primary-600 hover:underline">@picobase_app/client README</a></li>
            </ul>
          </section>

        </main>
      </div>
    </div>
  )
}

function TableOfContentsLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      className="block px-2 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-md transition-colors"
    >
      {children}
    </a>
  )
}

function CodeBlock({ children, language, filename }: { children: string; language?: string; filename?: string }) {
  const showHeader = filename || language

  return (
    <div className="my-6 rounded-xl overflow-hidden bg-gray-900 border border-gray-800">
      {showHeader && (
        <div className="px-4 py-2 border-b border-gray-800 bg-gray-900 flex items-center justify-between min-h-[36px]">
          <span className="text-xs font-mono text-gray-400">{filename || ''}</span>
          {language && <span className="text-xs font-mono text-gray-600 uppercase">{language}</span>}
        </div>
      )}
      <div className="p-4 overflow-x-auto">
        <pre className="text-sm font-mono leading-relaxed text-gray-200">
          <code>{children.trim()}</code>
        </pre>
      </div>
    </div>
  )
}
