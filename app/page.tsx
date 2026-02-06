import Link from 'next/link'
import { getAuthUrl } from '@/lib/auth-utils'

export default function Home() {
  const signInUrl = getAuthUrl('signin')
  const signUpUrl = getAuthUrl('signup')

  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-600 via-accent-600 to-primary-700 animate-gradient">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDE2djhoLTh2LThoOHptLTE2IDB2OGgtOHYtOGg4em0zMiAwdjhoLTh2LThoOHptLTE2IDE2djhoLTh2LThoOHptLTE2IDB2OGgtOHYtOGg4em0zMiAwdjhoLTh2LThoOHoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-30"></div>

        <div className="relative max-w-7xl mx-auto px-6 py-24 md:py-32 lg:py-40">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold text-white mb-6 leading-tight">
              Instant Backend
              <br />
              <span className="gradient-text from-green-200 to-blue-200">
                Infrastructure
              </span>
            </h1>

            <p className="text-xl md:text-2xl text-white/90 mb-8 max-w-2xl mx-auto leading-relaxed">
              Launch production-ready backends in seconds. Database, authentication, file storage, and APIs — all configured and ready to use.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              <Link
                href={signUpUrl}
                className="group relative px-8 py-4 bg-white text-primary-700 font-bold text-lg rounded-lg shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105"
              >
                <span className="relative z-10">Get Started Free</span>
              </Link>
              <Link
                href={signInUrl}
                className="px-8 py-4 bg-white/10 backdrop-blur-sm text-white font-semibold text-lg rounded-lg border-2 border-white/30 hover:bg-white/20 transition-all duration-300"
              >
                Sign In
              </Link>
            </div>

            <div className="flex flex-wrap gap-6 justify-center text-white/80 text-sm">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-300" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>No credit card required</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-300" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Deploy in 60 seconds</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-300" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Full API access</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 md:py-28 px-6 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 gradient-text from-primary-600 to-accent-600 dark:from-primary-400 dark:to-accent-400">
              Everything You Need to Build
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              A complete backend platform with all the features you expect from modern infrastructure
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Feature 1 */}
            <div className="p-8 rounded-2xl bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-850 border border-gray-200 dark:border-gray-700 card-hover">
              <div className="text-4xl mb-4">🗄️</div>
              <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">Real-time Database</h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                Powerful SQLite database with instant synchronization and real-time updates
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-8 rounded-2xl bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-850 border border-gray-200 dark:border-gray-700 card-hover">
              <div className="text-4xl mb-4">🔐</div>
              <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">Authentication</h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                Built-in user management with secure authentication and authorization out of the box
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-8 rounded-2xl bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-850 border border-gray-200 dark:border-gray-700 card-hover">
              <div className="text-4xl mb-4">💾</div>
              <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">File Storage</h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                Scalable cloud storage with automatic backups and CDN delivery
              </p>
            </div>

            {/* Feature 4 */}
            <div className="p-8 rounded-2xl bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-850 border border-gray-200 dark:border-gray-700 card-hover">
              <div className="text-4xl mb-4">⚡</div>
              <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">Instant APIs</h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                REST and real-time APIs generated automatically from your data models
              </p>
            </div>

            {/* Feature 5 */}
            <div className="p-8 rounded-2xl bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-850 border border-gray-200 dark:border-gray-700 card-hover">
              <div className="text-4xl mb-4">📊</div>
              <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">Admin Dashboard</h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                Visual interface for managing data, users, and configurations
              </p>
            </div>

            {/* Feature 6 */}
            <div className="p-8 rounded-2xl bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-850 border border-gray-200 dark:border-gray-700 card-hover">
              <div className="text-4xl mb-4">🌐</div>
              <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">Custom Domains</h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                Professional subdomain access for each project instance
              </p>
            </div>

            {/* Feature 7 */}
            <div className="p-8 rounded-2xl bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-850 border border-gray-200 dark:border-gray-700 card-hover">
              <div className="text-4xl mb-4">🔄</div>
              <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">Automatic Backups</h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                Continuous data protection with point-in-time recovery
              </p>
            </div>

            {/* Feature 8 */}
            <div className="p-8 rounded-2xl bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-850 border border-gray-200 dark:border-gray-700 card-hover">
              <div className="text-4xl mb-4">🏢</div>
              <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">Multi-tenancy</h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                Isolated instances for each project with complete data separation
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Value Proposition */}
      <section className="py-20 md:py-28 px-6 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900 dark:text-white">
                Stop Managing Infrastructure.
                <br />
                <span className="gradient-text from-primary-600 to-accent-600">Start Building Products.</span>
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
                Focus on what matters — your application logic and user experience. We handle the complexity of backend infrastructure, scaling, and maintenance.
              </p>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-primary-600 dark:text-primary-400 flex-shrink-0 mt-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">Deploy in Seconds</p>
                    <p className="text-gray-600 dark:text-gray-300">Instant provisioning with zero configuration required</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-primary-600 dark:text-primary-400 flex-shrink-0 mt-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">Production Ready</p>
                    <p className="text-gray-600 dark:text-gray-300">Enterprise-grade security and reliability from day one</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-primary-600 dark:text-primary-400 flex-shrink-0 mt-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">Scale Effortlessly</p>
                    <p className="text-gray-600 dark:text-gray-300">Automatic scaling to handle your growth</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="text-center p-8 bg-white dark:bg-gray-900 rounded-2xl shadow-lg">
                <div className="text-4xl font-bold gradient-text from-primary-600 to-accent-600 mb-2">
                  &lt;60s
                </div>
                <p className="text-gray-600 dark:text-gray-400 font-medium">Average Setup Time</p>
              </div>
              <div className="text-center p-8 bg-white dark:bg-gray-900 rounded-2xl shadow-lg">
                <div className="text-4xl font-bold gradient-text from-primary-600 to-accent-600 mb-2">
                  99.9%
                </div>
                <p className="text-gray-600 dark:text-gray-400 font-medium">Uptime SLA</p>
              </div>
              <div className="text-center p-8 bg-white dark:bg-gray-900 rounded-2xl shadow-lg">
                <div className="text-4xl font-bold gradient-text from-primary-600 to-accent-600 mb-2">
                  24/7
                </div>
                <p className="text-gray-600 dark:text-gray-400 font-medium">Automatic Backups</p>
              </div>
              <div className="text-center p-8 bg-white dark:bg-gray-900 rounded-2xl shadow-lg">
                <div className="text-4xl font-bold gradient-text from-primary-600 to-accent-600 mb-2">
                  Free
                </div>
                <p className="text-gray-600 dark:text-gray-400 font-medium">Starter Plan</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 md:py-28 px-6 bg-gradient-to-br from-primary-600 via-accent-600 to-primary-700">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Build Something Amazing?
          </h2>
          <p className="text-xl text-white/90 mb-10">
            Join thousands of developers who've shipped faster with instant backend infrastructure
          </p>
          <Link
            href={signUpUrl}
            className="inline-block px-10 py-5 bg-white text-primary-700 font-bold text-lg rounded-lg shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-105"
          >
            Start Building Now — It's Free
          </Link>
          <p className="mt-6 text-white/70 text-sm">
            No credit card required • Deploy in 60 seconds • Cancel anytime
          </p>
        </div>
      </section>
    </main>
  )
}
