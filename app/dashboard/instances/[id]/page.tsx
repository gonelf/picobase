import { getSession } from '@/lib/session'
import { redirect } from 'next/navigation'
import { getInstanceStatus } from '@/lib/pocketbase'
import { listApiKeys } from '@/lib/api-keys'
import Link from 'next/link'
import InstanceActions from '@/components/InstanceActions'
import ApiKeysList from '@/components/ApiKeysList'
import { getAuthUrl } from '@/lib/auth-utils'

export default async function InstanceDetail({ params }: { params: { id: string } }) {
  const session = await getSession()

  if (!session?.user?.id) {
    redirect(getAuthUrl('signin'))
  }

  const instance = await getInstanceStatus(params.id)

  if (!instance) {
    redirect('/dashboard')
  }

  const apiKeys = await listApiKeys(params.id)

  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <Link
          href="/dashboard"
          className="text-sm text-primary-600 hover:text-primary-700 mb-4 inline-block"
        >
          ← Back to instances
        </Link>
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {instance.name as string}
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              {instance.subdomain as string}
            </p>
          </div>
          <span
            className={`px-3 py-1 text-sm font-medium rounded-full ${instance.status === 'running'
              ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
              : instance.status === 'stopped'
                ? 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400'
                : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
              }`}
          >
            {instance.status as string}
          </span>
        </div>
      </div>

      <div className="space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Instance Details
          </h2>
          <dl className="space-y-3">
            <div className="flex justify-between">
              <dt className="text-sm text-gray-600 dark:text-gray-400">Instance ID:</dt>
              <dd className="text-sm font-mono text-gray-900 dark:text-white">
                {instance.id as string}
              </dd>
            </div>
            {instance.status === 'running' && instance.port && (
              <div className="flex justify-between">
                <dt className="text-sm text-gray-600 dark:text-gray-400">API Endpoint:</dt>
                <dd className="text-sm font-mono text-gray-900 dark:text-white">
                  http://localhost:{instance.port as number}
                </dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-sm text-gray-600 dark:text-gray-400">Created:</dt>
              <dd className="text-sm text-gray-900 dark:text-white">
                {new Date(instance.created_at as string).toLocaleDateString()}
              </dd>
            </div>
            {instance.last_started_at && (
              <div className="flex justify-between">
                <dt className="text-sm text-gray-600 dark:text-gray-400">Last Started:</dt>
                <dd className="text-sm text-gray-900 dark:text-white">
                  {new Date(instance.last_started_at as string).toLocaleString()}
                </dd>
              </div>
            )}
          </dl>
        </div>

        <InstanceActions instanceId={params.id} status={instance.status as string} />

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">API Keys</h2>
          </div>
          <ApiKeysList instanceId={params.id} initialKeys={apiKeys} />
        </div>
      </div>
    </div>
  )
}
