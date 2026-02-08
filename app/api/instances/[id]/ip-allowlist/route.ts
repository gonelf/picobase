import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { db } from '@/lib/db'
import { getIpAllowlist, addIpToAllowlist, removeIpFromAllowlist, toggleIpAllowlistEntry } from '@/lib/ip-allowlist'
import { logAuditEvent } from '@/lib/audit-log'

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

    const allowlist = await getIpAllowlist(instanceId)

    return NextResponse.json({ allowlist })
  } catch (error) {
    console.error('[IpAllowlist] Failed to get IP allowlist:', error)
    return NextResponse.json(
      {
        error: 'Failed to get IP allowlist',
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
    const { action, ipAddress, cidr, description, entryId, enabled } = body

    if (action === 'add') {
      const entry = await addIpToAllowlist(instanceId, ipAddress, { cidr, description })

      await logAuditEvent(session.user.id, 'ip_allowlist.add', 'ip_allowlist', {
        instanceId,
        resourceId: entry.id,
        metadata: { ipAddress, cidr },
      })

      return NextResponse.json(entry)
    } else if (action === 'remove' && entryId) {
      await removeIpFromAllowlist(entryId, instanceId)

      await logAuditEvent(session.user.id, 'ip_allowlist.remove', 'ip_allowlist', {
        instanceId,
        resourceId: entryId,
      })

      return NextResponse.json({ success: true })
    } else if (action === 'toggle' && entryId) {
      await toggleIpAllowlistEntry(entryId, instanceId, enabled)

      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('[IpAllowlist] Failed to update IP allowlist:', error)
    return NextResponse.json(
      {
        error: 'Failed to update IP allowlist',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}
