import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { db } from '@/lib/db'
import { getAuditLogs, exportAuditLogs } from '@/lib/audit-log'
import { createModuleLogger } from '@/lib/logger'

const log = createModuleLogger('API:Instances/Id/Audit-logs')

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

    const searchParams = request.nextUrl.searchParams
    const limit = parseInt(searchParams.get('limit') || '100', 10)
    const offset = parseInt(searchParams.get('offset') || '0', 10)
    const exportFormat = searchParams.get('export')

    if (exportFormat === 'csv') {
      const startDate = searchParams.get('startDate') || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
      const endDate = searchParams.get('endDate') || new Date().toISOString()

      const csv = await exportAuditLogs(instanceId, startDate, endDate)

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="audit-logs-${instanceId}-${Date.now()}.csv"`,
        },
      })
    }

    const logs = await getAuditLogs(instanceId, { limit, offset })

    return NextResponse.json({ logs })
  } catch (error) {
    log.error({ err: error }, '[AuditLogs] Failed to get audit logs')
    return NextResponse.json(
      {
        error: 'Failed to get audit logs',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}
