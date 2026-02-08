import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { db } from '@/lib/db'
import { getHealthMetrics, getRecentHealthChecks } from '@/lib/health-monitor'

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

    // Get health metrics and recent checks
    const metrics = await getHealthMetrics(instanceId, hoursBack)
    const recentChecks = await getRecentHealthChecks(instanceId, 50)

    return NextResponse.json({
      metrics,
      recentChecks,
    })
  } catch (error) {
    console.error('[Health] Failed to get health data:', error)
    return NextResponse.json(
      {
        error: 'Failed to get health data',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}
