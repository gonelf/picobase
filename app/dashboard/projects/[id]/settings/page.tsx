import { getSession } from '@/lib/session'
import { redirect } from 'next/navigation'
import { getInstanceStatus } from '@/lib/pocketbase'
import { getAuthUrl } from '@/lib/auth-utils'
import InstanceActions from '@/components/InstanceActions'

export default async function SettingsPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()

  if (!session?.user?.id) {
    redirect(getAuthUrl('signin'))
  }

  const { id } = await params
  const instance = await getInstanceStatus(id)

  if (!instance) {
    redirect('/dashboard')
  }

  const instancesDomain = process.env.INSTANCES_DOMAIN || 'localhost:3001'
  const protocol = instancesDomain.includes('localhost') ? 'http' : 'https'
  const publicUrl = `${protocol}://${instance.subdomain}.${instancesDomain}`
  const adminUrl = `${publicUrl}/_/`

  return (
    <div className="h-full flex flex-col">
      <div className="border-b border-gray-800 px-6 py-3 shrink-0">
        <h1 className="text-sm font-medium text-white">Project Settings</h1>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-2xl space-y-6">
          <div className="border border-gray-800 rounded-lg bg-gray-900 p-5">
            <h2 className="text-sm font-medium text-white mb-4">General</h2>
            <dl className="space-y-3">
              <div className="flex justify-between items-center">
                <dt className="text-sm text-gray-400">Project Name</dt>
                <dd className="text-sm text-white">{instance.name as string}</dd>
              </div>
              <div className="flex justify-between items-center">
                <dt className="text-sm text-gray-400">Subdomain</dt>
                <dd className="text-sm text-white font-mono">{instance.subdomain as string}</dd>
              </div>
              <div className="flex justify-between items-center">
                <dt className="text-sm text-gray-400">Project ID</dt>
                <dd className="text-sm text-gray-300 font-mono">{instance.id as string}</dd>
              </div>
              <div className="flex justify-between items-center">
                <dt className="text-sm text-gray-400">Status</dt>
                <dd>
                  <span className={`inline-flex items-center gap-1.5 text-sm ${
                    instance.status === 'running' ? 'text-green-400' : 'text-gray-400'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      instance.status === 'running' ? 'bg-green-500' : 'bg-gray-600'
                    }`} />
                    {instance.status as string}
                  </span>
                </dd>
              </div>
              <div className="flex justify-between items-center">
                <dt className="text-sm text-gray-400">Created</dt>
                <dd className="text-sm text-gray-300">
                  {new Date(instance.created_at as string).toLocaleDateString()}
                </dd>
              </div>
              {instance.last_started_at && (
                <div className="flex justify-between items-center">
                  <dt className="text-sm text-gray-400">Last Started</dt>
                  <dd className="text-sm text-gray-300">
                    {new Date(instance.last_started_at as string).toLocaleString()}
                  </dd>
                </div>
              )}
            </dl>
          </div>

          {instance.status === 'running' && (
            <div className="border border-gray-800 rounded-lg bg-gray-900 p-5">
              <h2 className="text-sm font-medium text-white mb-4">Connections</h2>
              <dl className="space-y-3">
                <div className="flex justify-between items-center">
                  <dt className="text-sm text-gray-400">Public URL</dt>
                  <dd>
                    <a
                      href={publicUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary-400 hover:text-primary-300 font-mono"
                    >
                      {publicUrl}
                    </a>
                  </dd>
                </div>
                <div className="flex justify-between items-center">
                  <dt className="text-sm text-gray-400">Admin Panel</dt>
                  <dd>
                    <a
                      href={adminUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-sm text-primary-400 hover:text-primary-300"
                    >
                      Open PocketBase Admin
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  </dd>
                </div>
              </dl>
            </div>
          )}

          <InstanceActions instanceId={id} status={instance.status as string} />
        </div>
      </div>
    </div>
  )
}
