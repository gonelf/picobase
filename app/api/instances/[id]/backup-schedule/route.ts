import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { db } from '@/lib/db'
import { getBackupSchedule, setBackupSchedule, getBackupHistory } from '@/lib/backup-scheduler'
import { logAuditEvent } from '@/lib/audit-log'
import { createModuleLogger } from '@/lib/logger'

const log = createModuleLogger('API:Instances/Id/Backup-schedule')

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

    const schedule = await getBackupSchedule(instanceId)
    const history = await getBackupHistory(instanceId, 20)

    return NextResponse.json({
      schedule,
      history,
    })
  } catch (error) {
    log.error({ err: error }, '[BackupSchedule] Failed to get backup schedule')
    return NextResponse.json(
      {
        error: 'Failed to get backup schedule',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}

export async function POST(
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

    const body = await request.json()
    const { enabled, intervalHours, retentionDays } = body

    const schedule = await setBackupSchedule(
      instanceId,
      intervalHours || 6,
      retentionDays || 30,
      enabled !== false
    )

    // Log audit event
    await logAuditEvent(session.user.id, 'settings.update', 'backup_schedule', {
      instanceId,
      metadata: { enabled, intervalHours, retentionDays },
    })

    return NextResponse.json(schedule)
  } catch (error) {
    log.error({ err: error }, '[BackupSchedule] Failed to set backup schedule')
    return NextResponse.json(
      {
        error: 'Failed to set backup schedule',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}
