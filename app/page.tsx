import Link from 'next/link'
import { getAuthUrl } from '@/lib/auth-utils'
import WaitlistForm from '@/components/WaitlistForm'
import CodeDemo from '@/components/CodeDemo'


export default function Home() {
  const signInUrl = getAuthUrl('signin')

  return (
    <main className="min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'SoftwareApplication',
            name: 'PicoBase',
            applicationCategory: 'DeveloperApplication',
            operatingSystem: 'Any',
            offers: {
              '@type': 'Offer',
              price: '0',
              priceCurrency: 'USD',
            },
            description: 'The open source Firebase alternative for vibe coders. Instant backend infrastructure with real-time database, authentication, and file storage.',
          }),
        }}
      />
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gray-950">

        {/* Nav bar */}
        <div className="relative max-w-7xl mx-auto px-6 pt-6 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div
              className="w-8 h-8 bg-white"
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
            <span className="text-white font-bold text-xl">PicoBase</span>
          </Link>
          <div className="flex items-center gap-6">
            <Link
              href="/docs"
              className="text-sm font-medium text-white/80 hover:text-white transition-colors"
            >
              Docs
            </Link>

            <Link
              href={signInUrl}
              className="px-6 py-2 bg-white/10 backdrop-blur-sm text-white font-semibold rounded-lg border border-white/30 hover:bg-white/20 transition-all duration-300"
            >
              Sign In
            </Link>
          </div>
        </div>

        <div className="relative max-w-7xl mx-auto px-6 pt-8 pb-16 md:pb-24 lg:pb-32">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left: Copy */}
            <div>
              <p className="text-primary-400 font-semibold text-sm uppercase tracking-wider mb-4">
                The backend for flow state
              </p>
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
                <span className="block text-4xl md:text-5xl mb-2 text-white/90">The Open Source</span>
                Backend for
                <br />
                <span className="gradient-text from-primary-400 to-accent-400">
                  Vibe Coders
                </span>
              </h1>

              <p className="text-xl text-white/80 mb-8 leading-relaxed max-w-xl">
                Stop managing migrations. Start vibing.
                From <code className="text-primary-300 bg-white/10 px-2 py-0.5 rounded text-base">npm install</code> to
                production data in 3 minutes. No Docker, no local env setup, no config fatigue.
              </p>

              <div className="mb-8">
                <p className="text-white/60 text-sm mb-4 font-medium uppercase tracking-wider">
                  Join the waitlist for early access
                </p>
                <WaitlistForm />
              </div>

              <div className="flex flex-wrap gap-6 text-white/70 text-sm">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Zero config</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>TypeScript-first</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Free tier</span>
                </div>
              </div>
            </div>

            {/* Right: Code Demo */}
            <div className="hidden lg:block">
              <CodeDemo />
            </div>
          </div>
        </div>
      </section>

      {/* Ready for your vibe */}
      <section className="py-12 px-6 bg-gray-900 border-y border-white/10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-white mb-2">Build with your favorite AI tools</h3>
            <p className="text-white/60 text-sm">Works seamlessly with your favorite AI coding tools</p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12">
            <div className="flex items-center gap-2 text-white/70 hover:text-white transition-colors">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L2 7v10l10 5 10-5V7L12 2z" />
              </svg>
              <span className="font-semibold">Cursor</span>
            </div>
            <div className="flex items-center gap-2 text-white/70 hover:text-white transition-colors">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
              </svg>
              <span className="font-semibold">v0</span>
            </div>
            <div className="flex items-center gap-2 text-white/70 hover:text-white transition-colors">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="12" cy="12" r="3" />
                <path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83" />
              </svg>
              <span className="font-semibold">bolt.new</span>
            </div>
            <div className="flex items-center gap-2 text-white/70 hover:text-white transition-colors">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
              <span className="font-semibold">lovable</span>
            </div>
            <div className="flex items-center gap-2 text-white/70 hover:text-white transition-colors">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" />
              </svg>
              <span className="font-semibold">Claude</span>
            </div>
            <div className="flex items-center gap-2 text-white/70 hover:text-white transition-colors">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
              <span className="font-semibold">Windsurf</span>
            </div>
            <div className="flex items-center gap-2 text-white/70 hover:text-white transition-colors">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <rect x="3" y="3" width="18" height="18" rx="2" />
              </svg>
              <span className="font-semibold">Codex</span>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works — 3 Steps */}
      <section className="py-20 md:py-28 px-6 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 gradient-text from-primary-600 to-accent-600 dark:from-primary-400 dark:to-accent-400">
              Ship in 3 Steps
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              No dashboards. No SQL migrations. No context switching. Stay in your editor.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Step 1 */}
            <div className="text-center p-8">
              <div className="w-16 h-16 rounded-2xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-primary-600 dark:text-primary-400">1</span>
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">Install</h3>
              <div className="bg-gray-900 dark:bg-gray-800 rounded-lg p-4 font-mono text-sm text-left">
                <span className="text-gray-500">$</span>
                <span className="text-green-400"> npm install @picobase_app/client</span>
              </div>
            </div>

            {/* Step 2 */}
            <div className="text-center p-8">
              <div className="w-16 h-16 rounded-2xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-primary-600 dark:text-primary-400">2</span>
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">Write Code</h3>
              <div className="bg-gray-900 dark:bg-gray-800 rounded-lg p-4 font-mono text-sm text-left">
                <div className="text-gray-500">// Collections auto-create</div>
                <div className="text-gray-200">pb.collection(<span className="text-green-400">&apos;posts&apos;</span>)</div>
                <div className="text-gray-200">&nbsp;&nbsp;.create({'{ title }'})</div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="text-center p-8">
              <div className="w-16 h-16 rounded-2xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-primary-600 dark:text-primary-400">3</span>
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">Ship</h3>
              <div className="bg-gray-900 dark:bg-gray-800 rounded-lg p-4 font-mono text-sm text-left">
                <span className="text-gray-500">$</span>
                <span className="text-green-400"> git push</span>
                <div className="text-gray-500 mt-1"># That&apos;s it. You&apos;re live.</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features — Reframed for Vibe Coders */}
      <section className="py-20 md:py-28 px-6 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900 dark:text-white">
              Everything You Need. Nothing You Don&apos;t.
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              We handle the backend complexity so you can stay in the zone
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Feature: Zero-Config Database */}
            <div className="p-8 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 card-hover">
              <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">Zero-Config Database</h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                Just write data. Collections create themselves. No SQL, no migrations, no schema files to maintain.
              </p>
            </div>

            {/* Feature: Drop-in Auth */}
            <div className="p-8 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 card-hover">
              <div className="w-12 h-12 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">Drop-in Auth</h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                One component. Email, password, OAuth. No auth provider config. Just <code className="text-sm bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">&lt;AuthForm /&gt;</code> and done.
              </p>
            </div>

            {/* Feature: Realtime Built In */}
            <div className="p-8 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 card-hover">
              <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">Realtime Built In</h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                Subscribe to changes with one line. No WebSocket setup, no Pusher, no polling. Data just updates.
              </p>
            </div>

            {/* Feature: TypeScript-First */}
            <div className="p-8 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 card-hover">
              <div className="w-12 h-12 rounded-xl bg-sky-100 dark:bg-sky-900/30 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-sky-600 dark:text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">TypeScript-First</h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                Full autocomplete on every query. Generate types from your schema with one CLI command. Your AI coding tool will thank you.
              </p>
            </div>

            {/* Feature: File Storage */}
            <div className="p-8 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 card-hover">
              <div className="w-12 h-12 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-orange-600 dark:text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">File Storage</h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                Upload files as part of any record. Automatic thumbnails, CDN delivery. No S3 bucket to configure.
              </p>
            </div>

            {/* Feature: AI-Friendly */}
            <div className="p-8 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 card-hover">
              <div className="w-12 h-12 rounded-xl bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-pink-600 dark:text-pink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">AI-Friendly</h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                Simple SDK that Cursor, Windsurf, and Claude understand perfectly. No complex SQL for your AI to hallucinate on.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* The Vibe Coder Stack */}
      <section className="py-20 md:py-28 px-6 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900 dark:text-white">
                Built for How
                <br />
                <span className="gradient-text from-primary-600 to-accent-600">You Actually Work</span>
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
                You don&apos;t need a DBA. You need a data store that keeps up with your ideas. PicoBase gets out of your way so you can ship what matters.
              </p>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-primary-600 dark:text-primary-400 flex-shrink-0 mt-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">No Dashboard Required</p>
                    <p className="text-gray-600 dark:text-gray-300">Manage your entire backend from your code editor. No browser tab switching.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-primary-600 dark:text-primary-400 flex-shrink-0 mt-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">Reads from Your .env</p>
                    <p className="text-gray-600 dark:text-gray-300">Call <code className="text-sm bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">createClient()</code> with zero arguments. URL and key come from your environment.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-primary-600 dark:text-primary-400 flex-shrink-0 mt-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">Cold Start? Handled.</p>
                    <p className="text-gray-600 dark:text-gray-300">Instances wake up automatically. The SDK retries with backoff so your users never see a 503.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="text-center p-8 bg-gray-50 dark:bg-gray-800 rounded-2xl">
                <div className="text-4xl font-bold gradient-text from-primary-600 to-accent-600 mb-2">
                  3 min
                </div>
                <p className="text-gray-600 dark:text-gray-400 font-medium">Install to Production</p>
              </div>
              <div className="text-center p-8 bg-gray-50 dark:bg-gray-800 rounded-2xl">
                <div className="text-4xl font-bold gradient-text from-primary-600 to-accent-600 mb-2">
                  0
                </div>
                <p className="text-gray-600 dark:text-gray-400 font-medium">Config Files Needed</p>
              </div>
              <div className="text-center p-8 bg-gray-50 dark:bg-gray-800 rounded-2xl">
                <div className="text-4xl font-bold gradient-text from-primary-600 to-accent-600 mb-2">
                  1 line
                </div>
                <p className="text-gray-600 dark:text-gray-400 font-medium">To Add Auth</p>
              </div>
              <div className="text-center p-8 bg-gray-50 dark:bg-gray-800 rounded-2xl">
                <div className="text-4xl font-bold gradient-text from-primary-600 to-accent-600 mb-2">
                  Free
                </div>
                <p className="text-gray-600 dark:text-gray-400 font-medium">To Start</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SDK Showcase */}
      <section className="py-20 md:py-28 px-6 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900 dark:text-white">
              Code That Feels Right
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Clean, predictable APIs that work the way you think
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Auth example */}
            <div className="rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
              <div className="px-5 py-3 bg-gray-100 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Authentication</span>
              </div>
              <div className="bg-white dark:bg-gray-900 p-5 font-mono text-sm leading-relaxed">
                <div className="text-gray-500">// React: Drop-in auth UI</div>
                <div className="text-gray-900 dark:text-gray-200">{'import { '}<span className="text-blue-600 dark:text-blue-400">AuthForm</span>{' } from '}<span className="text-green-600 dark:text-green-400">&apos;@picobase_app/react&apos;</span></div>
                <div className="text-gray-900 dark:text-gray-200 mt-2">{'<'}<span className="text-blue-600 dark:text-blue-400">AuthForm</span></div>
                <div className="text-gray-900 dark:text-gray-200">&nbsp;&nbsp;providers={'{['}
                  <span className="text-green-600 dark:text-green-400">&apos;google&apos;</span>, <span className="text-green-600 dark:text-green-400">&apos;github&apos;</span>
                  {']}'}</div>
                <div className="text-gray-900 dark:text-gray-200">&nbsp;&nbsp;redirectTo=<span className="text-green-600 dark:text-green-400">&quot;/dashboard&quot;</span></div>
                <div className="text-gray-900 dark:text-gray-200">{'/>'}</div>
              </div>
            </div>

            {/* Query example */}
            <div className="rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
              <div className="px-5 py-3 bg-gray-100 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Data Queries</span>
              </div>
              <div className="bg-white dark:bg-gray-900 p-5 font-mono text-sm leading-relaxed">
                <div className="text-gray-500">// Filter, sort, paginate</div>
                <div className="text-gray-900 dark:text-gray-200"><span className="text-purple-600 dark:text-purple-400">const</span> posts = <span className="text-purple-600 dark:text-purple-400">await</span></div>
                <div className="text-gray-900 dark:text-gray-200">&nbsp;&nbsp;pb.collection(<span className="text-green-600 dark:text-green-400">&apos;posts&apos;</span>)</div>
                <div className="text-gray-900 dark:text-gray-200">&nbsp;&nbsp;.getList(1, 20, {'{'}</div>
                <div className="text-gray-900 dark:text-gray-200">&nbsp;&nbsp;&nbsp;&nbsp;filter: <span className="text-green-600 dark:text-green-400">&apos;published = true&apos;</span>,</div>
                <div className="text-gray-900 dark:text-gray-200">&nbsp;&nbsp;&nbsp;&nbsp;sort: <span className="text-green-600 dark:text-green-400">&apos;-created&apos;</span>,</div>
                <div className="text-gray-900 dark:text-gray-200">&nbsp;&nbsp;{'}'})</div>
              </div>
            </div>

            {/* Realtime example */}
            <div className="rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
              <div className="px-5 py-3 bg-gray-100 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Realtime</span>
              </div>
              <div className="bg-white dark:bg-gray-900 p-5 font-mono text-sm leading-relaxed">
                <div className="text-gray-500">// Subscribe to changes</div>
                <div className="text-gray-900 dark:text-gray-200">pb.collection(<span className="text-green-600 dark:text-green-400">&apos;messages&apos;</span>)</div>
                <div className="text-gray-900 dark:text-gray-200">&nbsp;&nbsp;.subscribe((e) =&gt; {'{'}</div>
                <div className="text-gray-900 dark:text-gray-200">&nbsp;&nbsp;&nbsp;&nbsp;console.log(e.action, e.record)</div>
                <div className="text-gray-900 dark:text-gray-200">&nbsp;&nbsp;{'}'})</div>
              </div>
            </div>

            {/* React hook example */}
            <div className="rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
              <div className="px-5 py-3 bg-gray-100 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">React Hook</span>
              </div>
              <div className="bg-white dark:bg-gray-900 p-5 font-mono text-sm leading-relaxed">
                <div className="text-gray-500">// One hook, full CRUD</div>
                <div className="text-gray-900 dark:text-gray-200"><span className="text-purple-600 dark:text-purple-400">const</span> {'{ items, loading }'} =</div>
                <div className="text-gray-900 dark:text-gray-200">&nbsp;&nbsp;useCollection(<span className="text-green-600 dark:text-green-400">&apos;posts&apos;</span>, {'{'}</div>
                <div className="text-gray-900 dark:text-gray-200">&nbsp;&nbsp;&nbsp;&nbsp;sort: <span className="text-green-600 dark:text-green-400">&apos;-created&apos;</span></div>
                <div className="text-gray-900 dark:text-gray-200">&nbsp;&nbsp;{'}'})</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20 md:py-28 px-6 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900 dark:text-white">
              Start Free. Scale When You&apos;re Ready.
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              No credit card. No commitment. Just start building.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Free */}
            <div className="rounded-2xl border border-gray-200 dark:border-gray-700 p-8 flex flex-col">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Free</h3>
              <div className="mt-4 mb-6">
                <span className="text-5xl font-bold text-gray-900 dark:text-white">$0</span>
                <span className="text-gray-500 dark:text-gray-400 ml-1">/month</span>
              </div>
              <ul className="space-y-3 mb-8 flex-1">
                <li className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                  <svg className="w-5 h-5 text-primary-600 dark:text-primary-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  2 projects
                </li>
                <li className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                  <svg className="w-5 h-5 text-primary-600 dark:text-primary-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  1 GB storage
                </li>
                <li className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                  <svg className="w-5 h-5 text-primary-600 dark:text-primary-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Fair-use traffic
                </li>
              </ul>
              <div className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold rounded-lg text-center">
                Get Started Free
              </div>
            </div>

            {/* Starter */}
            <div className="rounded-2xl border-2 border-primary-600 p-8 flex flex-col relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary-600 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                Popular
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Starter</h3>
              <div className="mt-4 mb-6">
                <span className="text-5xl font-bold text-gray-900 dark:text-white">$7</span>
                <span className="text-gray-500 dark:text-gray-400 ml-1">/month</span>
              </div>
              <ul className="space-y-3 mb-8 flex-1">
                <li className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                  <svg className="w-5 h-5 text-primary-600 dark:text-primary-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  10 projects
                </li>
                <li className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                  <svg className="w-5 h-5 text-primary-600 dark:text-primary-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  10 GB storage
                </li>
              </ul>
              <div className="px-6 py-3 bg-primary-600 text-white font-semibold rounded-lg text-center">
                Get Started
              </div>
            </div>

            {/* Pro */}
            <div className="rounded-2xl border border-gray-200 dark:border-gray-700 p-8 flex flex-col">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Pro</h3>
              <div className="mt-4 mb-6">
                <span className="text-5xl font-bold text-gray-900 dark:text-white">$19</span>
                <span className="text-gray-500 dark:text-gray-400 ml-1">/month</span>
              </div>
              <ul className="space-y-3 mb-8 flex-1">
                <li className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                  <svg className="w-5 h-5 text-primary-600 dark:text-primary-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Unlimited projects
                </li>
                <li className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                  <svg className="w-5 h-5 text-primary-600 dark:text-primary-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  50 GB storage
                </li>
              </ul>
              <div className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold rounded-lg text-center">
                Get Started
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 md:py-28 px-6 bg-gray-950">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Make Your Weekend Project,<br />Not Your Infrastructure
          </h2>
          <p className="text-xl text-white/80 mb-10 max-w-2xl mx-auto">
            Join developers who ship faster by leaving backend complexity behind. Get early access when we launch.
          </p>
          <WaitlistForm />
          <p className="mt-6 text-white/50 text-sm">
            No credit card required. No setup. Just vibes.
          </p>
        </div>
      </section>


      {/* Footer */}
      <footer className="bg-gray-950 border-t border-white/10 py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div>
              <p className="text-sm font-semibold text-white mb-3">Product</p>
              <div className="flex flex-col gap-2">
                <Link href="/docs" className="text-sm text-white/60 hover:text-white transition-colors">Documentation</Link>
                <Link href="https://github.com/picobase/picobase" className="text-sm text-white/60 hover:text-white transition-colors">GitHub</Link>
                <Link href="https://twitter.com/picobase" className="text-sm text-white/60 hover:text-white transition-colors">Twitter</Link>
              </div>
            </div>
            <div className="col-span-2">
              <p className="text-sm font-semibold text-white mb-3">Compare</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <Link href="/compare/supabase" className="text-sm text-white/60 hover:text-white transition-colors">PicoBase vs Supabase</Link>
                <Link href="/compare/firebase" className="text-sm text-white/60 hover:text-white transition-colors">PicoBase vs Firebase</Link>
                <Link href="/compare/appwrite" className="text-sm text-white/60 hover:text-white transition-colors">PicoBase vs Appwrite</Link>
                <Link href="/compare/convex" className="text-sm text-white/60 hover:text-white transition-colors">PicoBase vs Convex</Link>
                <Link href="/compare/nhost" className="text-sm text-white/60 hover:text-white transition-colors">PicoBase vs Nhost</Link>
              </div>
            </div>
          </div>
          <div className="border-t border-white/10 pt-6 text-sm text-white/60">
            <p>&copy; {new Date().getFullYear()} PicoBase. All rights reserved.</p>
          </div>
        </div>
      </footer>

    </main >
  )
}
