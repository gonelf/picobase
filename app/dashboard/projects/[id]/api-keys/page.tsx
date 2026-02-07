import { getSession } from '@/lib/session'
import { redirect } from 'next/navigation'
import { getInstanceStatus } from '@/lib/pocketbase'
import { listApiKeys } from '@/lib/api-keys'
import { getAuthUrl } from '@/lib/auth-utils'
import ApiKeysList from '@/components/ApiKeysList'

export default async function ApiKeysPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()

  if (!session?.user?.id) {
    redirect(getAuthUrl('signin'))
  }

  const { id } = await params
  const instance = await getInstanceStatus(id)

  if (!instance) {
    redirect('/dashboard')
  }

  const apiKeys = await listApiKeys(id)

  return (
    <div className="h-full flex flex-col">
      <div className="border-b border-gray-800 px-6 py-3 shrink-0">
        <h1 className="text-sm font-medium text-white">API Keys</h1>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-3xl">
          <ApiKeysList instanceId={id} initialKeys={apiKeys} />
        </div>
      </div>
    </div>
  )
}
