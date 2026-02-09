import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { db } from '@/lib/db'
import { createHmac } from 'crypto'
import { createModuleLogger } from '@/lib/logger'

const log = createModuleLogger('API:Instances/Id/Webhooks/Test')

/**
 * POST /api/instances/[id]/webhooks/test
 * Sends a test webhook event to the specified URL.
 * Body: { url: string, secret: string }
 */
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

    const instanceResult = await db.execute({
      sql: 'SELECT id FROM instances WHERE id = ? AND user_id = ?',
      args: [instanceId, session.user.id],
    })

    if (instanceResult.rows.length === 0) {
      return NextResponse.json({ error: 'Instance not found' }, { status: 404 })
    }

    const body = await request.json()
    const { url, secret } = body

    if (!url) {
      return NextResponse.json(
        { error: 'Validation error', details: 'URL is required' },
        { status: 400 }
      )
    }

    // Build test payload
    const payload = JSON.stringify({
      event: 'test',
      timestamp: new Date().toISOString(),
      instance_id: instanceId,
      data: {
        id: 'test_user_123',
        email: 'test@example.com',
        created: new Date().toISOString(),
      },
    })

    // Compute HMAC signature
    const signature = createHmac('sha256', secret || '')
      .update(payload)
      .digest('hex')

    // Send test request
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 10000)

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': `sha256=${signature}`,
          'X-Webhook-Event': 'test',
          'User-Agent': 'PicoBase-Webhook/1.0',
        },
        body: payload,
        signal: controller.signal,
      })

      clearTimeout(timeout)

      if (response.ok) {
        return NextResponse.json({
          message: `Endpoint responded with ${response.status} ${response.statusText}`,
        })
      } else {
        return NextResponse.json(
          { message: `Endpoint returned ${response.status} ${response.statusText}` },
          { status: 400 }
        )
      }
    } catch (fetchError) {
      clearTimeout(timeout)
      const message = fetchError instanceof Error
        ? (fetchError.name === 'AbortError' ? 'Request timed out after 10s' : fetchError.message)
        : 'Request failed'
      return NextResponse.json({ message }, { status: 400 })
    }
  } catch (error) {
    log.error({ err: error }, 'Error testing webhook')
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
