import { getSession } from '@/lib/session'
import { redirect } from 'next/navigation'
import { getInstanceStatus } from '@/lib/pocketbase'
import { getAuthUrl } from '@/lib/auth-utils'
import DataBrowserSection from '@/components/DataBrowserSection'
import QuickStats from '@/components/QuickStats'

export default async function EditorPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()

  if (!session?.user?.id) {
    redirect(getAuthUrl('signin'))
  }

  const { id } = await params
  const instance = await getInstanceStatus(id)

  if (!instance) {
    redirect('/dashboard')
  }

  const isRunning = instance.status === 'running'

  return (
    <div className="h-full flex flex-col">
      <div className="border-b border-gray-800 px-6 py-3 flex items-center justify-between shrink-0">
        <h1 className="text-sm font-medium text-white">Table Editor</h1>
        {isRunning && (
          <QuickStats instanceId={id} />
        )}
      </div>

      <div className="flex-1 overflow-auto p-6">
        {isRunning ? (
          <DataBrowserSection instanceId={id} />
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-4 rounded-lg bg-gray-800 flex items-center justify-center">
                <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5.636 18.364a9 9 0 010-12.728m12.728 0a9 9 0 010 12.728M12 9v2m0 4h.01" />
                </svg>
              </div>
              <h3 className="text-sm font-medium text-white mb-1">Project is not running</h3>
              <p className="text-xs text-gray-500">Start your project from Settings to browse tables.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
