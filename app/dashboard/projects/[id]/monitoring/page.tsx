import { getSession } from '@/lib/session'
import { redirect } from 'next/navigation'
import { getInstanceStatus } from '@/lib/pocketbase'
import { getAuthUrl } from '@/lib/auth-utils'
import MetricsDashboard from '@/components/MetricsDashboard'
import HealthMonitor from '@/components/HealthMonitor'
import AlertsPanel from '@/components/AlertsPanel'

export default async function MonitoringPage({ params }: { params: Promise<{ id: string }> }) {
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
        <h1 className="text-sm font-medium text-white">Monitoring & Alerts</h1>
        <p className="text-xs text-gray-500 mt-1">
          Performance metrics, health checks, and alerts for your instance
        </p>
      </div>

      <div className="flex-1 overflow-auto p-6 space-y-8">
        {/* Alerts Section */}
        <section>
          <AlertsPanel instanceId={id} />
        </section>

        {/* Health Monitor Section */}
        <section>
          <HealthMonitor instanceId={id} />
        </section>

        {/* Metrics Dashboard Section */}
        <section>
          <MetricsDashboard instanceId={id} />
        </section>
      </div>
    </div>
  )
}
