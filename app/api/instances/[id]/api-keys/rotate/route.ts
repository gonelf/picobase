import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { db } from '@/lib/db'
import { rotateApiKey } from '@/lib/api-keys'
import { logAuditEvent } from '@/lib/audit-log'

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
    const { keyId, gracePeriodHours } = body

    if (!keyId) {
      return NextResponse.json({ error: 'keyId is required' }, { status: 400 })
    }

    const result = await rotateApiKey(keyId, instanceId, gracePeriodHours || 24)

    // Log audit event
    await logAuditEvent(session.user.id, 'api_key.rotate', 'api_key', {
      instanceId,
      resourceId: keyId,
      metadata: { newKeyId: result.oldKeyId, gracePeriodHours },
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('[ApiKeys] Failed to rotate API key:', error)
    return NextResponse.json(
      {
        error: 'Failed to rotate API key',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}
