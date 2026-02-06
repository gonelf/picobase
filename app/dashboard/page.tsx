import { getSession } from '@/lib/session'
import { listUserInstances } from '@/lib/pocketbase'
import Link from 'next/link'
import InstanceCard from '@/components/InstanceCard'

export default async function Dashboard() {
  const session = await getSession()

  if (!session?.user?.id) {
    return null
  }

  const instances = await listUserInstances(session.user.id)

  // Serialize instances to plain objects to avoid Next.js warning
  const serializedInstances = instances.map((instance: any) => ({
    id: instance.id,
    name: instance.name,
    subdomain: instance.subdomain,
    status: instance.status,
    port: instance.port,
    created_at: instance.created_at,
    last_started_at: instance.last_started_at,
  }))

  return (
    <div>
      <div className="flex justify-between items-center mb-12">
        <div>
          <h1 className="text-4xl md:text-5xl font-bold mb-3">
            <span className="gradient-text from-primary-600 to-accent-600 dark:from-primary-400 dark:to-accent-400">
              Your Instances
            </span>
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Manage your backend instances and deployments
          </p>
        </div>
        <Link
          href="/dashboard/new"
          className="group relative px-6 py-3 bg-gradient-to-r from-primary-600 to-accent-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
        >
          <span className="relative z-10">+ Create Instance</span>
        </Link>
      </div>

      {serializedInstances.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-lg">
          <div className="max-w-md mx-auto">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-primary-100 to-accent-100 dark:from-primary-900/30 dark:to-accent-900/30 flex items-center justify-center">
              <svg className="w-10 h-10 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
              No instances yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-8 leading-relaxed">
              Get started by creating your first backend instance.
              It takes less than 60 seconds to deploy.
            </p>
            <Link
              href="/dashboard/new"
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-primary-600 to-accent-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create Your First Instance
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {serializedInstances.map((instance) => (
            <InstanceCard key={instance.id} instance={instance} />
          ))}
        </div>
      )}
    </div>
  )
}
