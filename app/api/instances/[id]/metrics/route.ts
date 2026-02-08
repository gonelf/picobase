import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { db } from '@/lib/db'
import { getMetricsSummary, getEndpointMetrics, getMetricsTimeSeries } from '@/lib/metrics'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: instanceId } = await params

    // Verify instance ownership
    const instanceResult = await db.execute({
      sql: 'SELECT user_id FROM instances WHERE id = ?',
      args: [instanceId],
    })

    if (instanceResult.rows.length === 0) {
      return NextResponse.json({ error: 'Instance not found' }, { status: 404 })
    }

    if (instanceResult.rows[0].user_id !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams
    const hoursBack = parseInt(searchParams.get('hours') || '24', 10)
    const intervalMinutes = parseInt(searchParams.get('interval') || '60', 10)

    // Get metrics data
    const summary = await getMetricsSummary(instanceId, hoursBack)
    const endpoints = await getEndpointMetrics(instanceId, hoursBack)
    const timeSeries = await getMetricsTimeSeries(instanceId, hoursBack, intervalMinutes)

    return NextResponse.json({
      summary,
      endpoints,
      timeSeries,
    })
  } catch (error) {
    console.error('[Metrics] Failed to get metrics:', error)
    return NextResponse.json(
      {
        error: 'Failed to get metrics',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}
