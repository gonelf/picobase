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

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Your Instances
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Manage your PocketBase instances
          </p>
        </div>
        <Link
          href="/dashboard/new"
          className="rounded-lg bg-primary-600 px-4 py-2 text-white font-semibold hover:bg-primary-700 transition-colors"
        >
          Create Instance
        </Link>
      </div>

      {instances.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No instances yet
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Get started by creating your first PocketBase instance
          </p>
          <Link
            href="/dashboard/new"
            className="inline-flex items-center rounded-lg bg-primary-600 px-4 py-2 text-white font-semibold hover:bg-primary-700 transition-colors"
          >
            Create Your First Instance
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {instances.map((instance: any) => (
            <InstanceCard key={instance.id} instance={instance} />
          ))}
        </div>
      )}
    </div>
  )
}
