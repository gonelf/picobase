import Link from 'next/link'
import PublicPlayground from '@/components/PublicPlayground'

export const metadata = {
  title: 'API Playground - PicoBase',
  description: 'Try PicoBase API with live demo data. Test queries, filters, and relations without signing up.',
}

export default function PlaygroundPage() {
  return (
    <main className="min-h-screen bg-gray-950">
      {/* Header */}
      <div className="border-b border-gray-800 bg-gray-900/50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
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
            <div className="flex items-center gap-4">
              <Link
                href="/docs"
                className="text-sm text-gray-400 hover:text-white transition-colors"
              >
                Documentation
              </Link>
              <Link
                href="/auth/signin"
                className="text-sm text-gray-400 hover:text-white transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/auth/signup"
                className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-500 text-sm font-medium transition-colors"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">API Playground</h1>
          <p className="text-gray-400">
            Explore PicoBase's API with live demo data. Test queries, filters, sorting, and relations in real-time.
          </p>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Playground - 2/3 width */}
          <div className="lg:col-span-2">
            <div className="h-[800px]">
              <PublicPlayground />
            </div>
          </div>

          {/* Sidebar - 1/3 width */}
          <div className="space-y-6">
            {/* Quick Guide */}
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
              <h2 className="text-sm font-semibold text-white mb-3">Quick Guide</h2>
              <div className="space-y-3 text-xs text-gray-400">
                <div>
                  <h3 className="text-white font-medium mb-1">1. Select Collection</h3>
                  <p>Choose a data collection to query from the dropdown.</p>
                </div>
                <div>
                  <h3 className="text-white font-medium mb-1">2. Choose Method</h3>
                  <p>Pick getList to fetch multiple records or getOne for a single record.</p>
                </div>
                <div>
                  <h3 className="text-white font-medium mb-1">3. Add Filters</h3>
                  <p>Use PocketBase filter syntax to query specific data.</p>
                </div>
                <div>
                  <h3 className="text-white font-medium mb-1">4. Run Query</h3>
                  <p>Click "Run Query" to see results and generated SDK code.</p>
                </div>
              </div>
            </div>

            {/* Filter Examples */}
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
              <h2 className="text-sm font-semibold text-white mb-3">Filter Examples</h2>
              <div className="space-y-2 text-xs">
                <div className="font-mono bg-gray-950 p-2 rounded">
                  <div className="text-gray-500 mb-1">Exact match:</div>
                  <div className="text-gray-300">status = "active"</div>
                </div>
                <div className="font-mono bg-gray-950 p-2 rounded">
                  <div className="text-gray-500 mb-1">Comparison:</div>
                  <div className="text-gray-300">views &gt; 100</div>
                </div>
                <div className="font-mono bg-gray-950 p-2 rounded">
                  <div className="text-gray-500 mb-1">Contains text:</div>
                  <div className="text-gray-300">title ~ "guide"</div>
                </div>
                <div className="font-mono bg-gray-950 p-2 rounded">
                  <div className="text-gray-500 mb-1">Multiple conditions:</div>
                  <div className="text-gray-300">published = true && views &gt; 100</div>
                </div>
              </div>
              <Link
                href="/docs/filter-syntax"
                className="inline-flex items-center gap-1 text-xs text-primary-500 hover:text-primary-400 mt-3 transition-colors"
              >
                View full filter reference
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>

            {/* Ready to Build */}
            <div className="bg-gradient-to-br from-primary-900/20 to-primary-800/10 border border-primary-800/50 rounded-lg p-4">
              <h2 className="text-sm font-semibold text-white mb-2">Ready to Build?</h2>
              <p className="text-xs text-gray-400 mb-4">
                Create your own instance with full API access, authentication, file storage, and realtime updates.
              </p>
              <Link
                href="/auth/signup"
                className="block w-full px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-500 text-sm font-medium transition-colors text-center"
              >
                Get Started Free
              </Link>
            </div>

            {/* Features */}
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
              <h2 className="text-sm font-semibold text-white mb-3">Full Features</h2>
              <ul className="space-y-2 text-xs text-gray-400">
                <li className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-green-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>All CRUD operations (create, read, update, delete)</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-green-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Email/password & OAuth authentication</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-green-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Realtime subscriptions</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-green-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>File uploads & storage</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-green-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>TypeScript SDK with full type safety</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-green-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>React hooks & components</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
