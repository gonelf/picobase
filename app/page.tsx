import Link from 'next/link'
import { getAuthUrl } from '@/lib/auth-utils'

export default function Home() {
  const signInUrl = getAuthUrl('signin')
  const signUpUrl = getAuthUrl('signup')

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm">
        <div className="text-center">
          <h1 className="text-6xl font-bold mb-4 bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">
            PicoBase
          </h1>
          <p className="text-xl mb-8 text-gray-600 dark:text-gray-300">
            Multi-tenant Backend-as-a-Service Platform
          </p>
          <p className="mb-8 text-gray-500 dark:text-gray-400">
            Build your own Supabase alternative with PocketBase instances, powered by Turso and Cloudflare R2
          </p>

          <div className="flex gap-4 justify-center">
            <Link
              href={signInUrl}
              className="rounded-lg bg-primary-600 px-6 py-3 text-white font-semibold hover:bg-primary-700 transition-colors"
            >
              Sign In
            </Link>
            <Link
              href={signUpUrl}
              className="rounded-lg border border-primary-600 px-6 py-3 text-primary-600 font-semibold hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
            >
              Sign Up
            </Link>
          </div>

          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
            <div className="p-6 rounded-lg border border-gray-200 dark:border-gray-700">
              <h3 className="font-bold mb-2 text-primary-600">🚀 Instant Instances</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Create PocketBase instances on-demand with automatic database management
              </p>
            </div>
            <div className="p-6 rounded-lg border border-gray-200 dark:border-gray-700">
              <h3 className="font-bold mb-2 text-primary-600">💾 Persistent Storage</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Your data is safely stored in Cloudflare R2 with automatic backups
              </p>
            </div>
            <div className="p-6 rounded-lg border border-gray-200 dark:border-gray-700">
              <h3 className="font-bold mb-2 text-primary-600">🔑 API Ready</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Get API keys and endpoints instantly for your applications
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
