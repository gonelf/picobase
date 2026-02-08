import { getSession } from '@/lib/session'
import { redirect } from 'next/navigation'
import { getInstanceStatus } from '@/lib/pocketbase'
import { getAuthUrl } from '@/lib/auth-utils'
import AuditLogsPanel from '@/components/AuditLogsPanel'
import IpAllowlistPanel from '@/components/IpAllowlistPanel'

export default async function SecurityPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()

  if (!session?.user?.id) {
    redirect(getAuthUrl('signin'))
  }

  const { id } = await params
  const instance = await getInstanceStatus(id)

  if (!instance) {
    redirect('/dashboard')
  }

  return (
    <div className="h-full flex flex-col">
      <div className="border-b border-gray-800 px-6 py-3 shrink-0">
        <h1 className="text-sm font-medium text-white">Security</h1>
        <p className="text-xs text-gray-500 mt-1">
          IP allowlist, audit logs, and security settings
        </p>
      </div>

      <div className="flex-1 overflow-auto p-6 space-y-8">
        {/* IP Allowlist Section */}
        <section>
          <IpAllowlistPanel instanceId={id} />
        </section>

        {/* Audit Logs Section */}
        <section>
          <AuditLogsPanel instanceId={id} />
        </section>
      </div>
    </div>
  )
}
