import { getSession } from '@/lib/session'
import { redirect } from 'next/navigation'
import { getInstanceStatus } from '@/lib/pocketbase'
import { listApiKeys } from '@/lib/api-keys'
import { getAuthUrl } from '@/lib/auth-utils'
import QuickStartSection from '@/components/QuickStartSection'

export default async function QuickStartPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()

  if (!session?.user?.id) {
    redirect(getAuthUrl('signin'))
  }

  const { id } = await params
  const instance = await getInstanceStatus(id)

  if (!instance) {
    redirect('/dashboard')
  }

  if (instance.status !== 'running') {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="bg-yellow-900/20 border border-yellow-800 rounded-lg p-6 text-center">
          <svg className="w-12 h-12 text-yellow-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h2 className="text-xl font-bold text-white mb-2">Instance Not Running</h2>
          <p className="text-gray-400 mb-4">
            Your instance needs to be running to get started. Start it from the settings page.
          </p>
          <a
            href={`/dashboard/projects/${id}/settings`}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-500 transition-colors"
          >
            Go to Settings
          </a>
        </div>
      </div>
    )
  }

  const apiKeys = await listApiKeys(id)

  // Get public URL for the instance
  const instancesDomain = process.env.INSTANCES_DOMAIN || 'localhost:3001'
  const protocol = instancesDomain.includes('localhost') ? 'http' : 'https'
  const publicUrl = `${protocol}://${instance.subdomain}.${instancesDomain}`

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white mb-2">Quick Start Guide</h1>
        <p className="text-gray-400">
          Get your app connected to PicoBase in under 2 minutes. Just copy, paste, and code! 🚀
        </p>
      </div>

      <QuickStartSection
        instanceId={id}
        instanceUrl={publicUrl}
        existingKeys={apiKeys}
      />

      {/* Additional helpful sections */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-blue-600/20 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-white">Learn the Basics</h3>
          </div>
          <p className="text-gray-400 text-sm mb-4">
            New to PicoBase? Check out our step-by-step guide with real code examples.
          </p>
          <a
            href="/docs"
            target="_blank"
            className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors"
          >
            Read the Docs
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </a>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-purple-600/20 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-white">Code Examples</h3>
          </div>
          <p className="text-gray-400 text-sm mb-4">
            Jump right in with working examples for auth, database, and realtime features.
          </p>
          <a
            href={`/dashboard/projects/${id}/playground`}
            className="inline-flex items-center gap-2 text-purple-400 hover:text-purple-300 text-sm font-medium transition-colors"
          >
            Try the Playground
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </a>
        </div>
      </div>

      {/* Common Next Steps */}
      <div className="mt-8 bg-gray-900 border border-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">What Most People Do Next</h3>
        <div className="space-y-3">
          <a
            href={`/dashboard/projects/${id}/editor`}
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800 transition-colors group"
          >
            <div className="w-8 h-8 bg-gray-800 group-hover:bg-primary-600/20 rounded flex items-center justify-center transition-colors">
              <svg className="w-4 h-4 text-gray-400 group-hover:text-primary-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M3 14h18M3 6h18M3 18h18M8 6v12M16 6v12" />
              </svg>
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium text-white group-hover:text-primary-400 transition-colors">Create Your First Table</div>
              <div className="text-xs text-gray-500">Design your data structure with the visual editor</div>
            </div>
            <svg className="w-5 h-5 text-gray-600 group-hover:text-gray-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </a>

          <a
            href={`/dashboard/projects/${id}/auth`}
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800 transition-colors group"
          >
            <div className="w-8 h-8 bg-gray-800 group-hover:bg-primary-600/20 rounded flex items-center justify-center transition-colors">
              <svg className="w-4 h-4 text-gray-400 group-hover:text-primary-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium text-white group-hover:text-primary-400 transition-colors">Set Up Authentication</div>
              <div className="text-xs text-gray-500">Enable email/password login or social OAuth</div>
            </div>
            <svg className="w-5 h-5 text-gray-600 group-hover:text-gray-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </a>

          <a
            href={`/dashboard/projects/${id}/api-keys`}
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800 transition-colors group"
          >
            <div className="w-8 h-8 bg-gray-800 group-hover:bg-primary-600/20 rounded flex items-center justify-center transition-colors">
              <svg className="w-4 h-4 text-gray-400 group-hover:text-primary-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium text-white group-hover:text-primary-400 transition-colors">Manage API Keys</div>
              <div className="text-xs text-gray-500">Create separate keys for dev, staging, and production</div>
            </div>
            <svg className="w-5 h-5 text-gray-600 group-hover:text-gray-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </a>
        </div>
      </div>
    </div>
  )
}
