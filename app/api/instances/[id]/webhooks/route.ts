import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { db } from '@/lib/db'
import { createModuleLogger } from '@/lib/logger'

const log = createModuleLogger('API:Instances/Id/Webhooks')

/**
 * GET /api/instances/[id]/webhooks
 * Fetches all webhooks configured for an instance.
 */
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

    const instanceResult = await db.execute({
      sql: 'SELECT id FROM instances WHERE id = ? AND user_id = ?',
      args: [instanceId, session.user.id],
    })

    if (instanceResult.rows.length === 0) {
      return NextResponse.json({ error: 'Instance not found' }, { status: 404 })
    }

    const result = await db.execute({
      sql: 'SELECT id, url, events, enabled, secret, created_at, updated_at FROM webhooks WHERE instance_id = ? ORDER BY created_at ASC',
      args: [instanceId],
    })

    const webhooks = result.rows.map(row => ({
      id: row.id as string,
      url: row.url as string,
      events: JSON.parse((row.events as string) || '[]'),
      enabled: row.enabled === 1,
      secret: row.secret as string,
      created_at: row.created_at as string,
      updated_at: row.updated_at as string,
    }))

    return NextResponse.json({ webhooks })
  } catch (error) {
    log.error({ err: error }, 'Error fetching webhooks')
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/instances/[id]/webhooks
 * Replaces all webhooks for an instance (full sync).
 * Body: { webhooks: Webhook[] }
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: instanceId } = await params

    const instanceResult = await db.execute({
      sql: 'SELECT id FROM instances WHERE id = ? AND user_id = ?',
      args: [instanceId, session.user.id],
    })

    if (instanceResult.rows.length === 0) {
      return NextResponse.json({ error: 'Instance not found' }, { status: 404 })
    }

    const body = await request.json()
    const webhooks: Array<{
      id: string
      url: string
      events: string[]
      enabled: boolean
      secret: string
    }> = body.webhooks || []

    // Validate webhooks
    for (const webhook of webhooks) {
      if (!webhook.url) {
        return NextResponse.json(
          { error: 'Validation error', details: 'Each webhook must have a URL' },
          { status: 400 }
        )
      }

      if (!webhook.events || webhook.events.length === 0) {
        return NextResponse.json(
          { error: 'Validation error', details: 'Each webhook must have at least one event' },
          { status: 400 }
        )
      }
    }

    const now = new Date().toISOString()

    // Delete existing webhooks for this instance
    await db.execute({
      sql: 'DELETE FROM webhooks WHERE instance_id = ?',
      args: [instanceId],
    })

    // Insert new webhooks
    for (const webhook of webhooks) {
      await db.execute({
        sql: `INSERT INTO webhooks (id, instance_id, url, events, enabled, secret, created_at, updated_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          webhook.id,
          instanceId,
          webhook.url,
          JSON.stringify(webhook.events),
          webhook.enabled ? 1 : 0,
          webhook.secret,
          now,
          now,
        ],
      })
    }

    return NextResponse.json({ webhooks, updated: webhooks.length })
  } catch (error) {
    log.error({ err: error }, 'Error saving webhooks')
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
