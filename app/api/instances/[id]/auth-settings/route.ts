import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { getInstanceCredentials } from '@/lib/get-instance-credentials'
import { authenticatedPocketBaseRequest } from '@/lib/pocketbase-auth'
import { db } from '@/lib/db'

/**
 * GET /api/instances/[id]/auth-settings
 * Fetches the auth options from the PocketBase "users" collection schema
 * and the instance-level auth/mail settings.
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
      sql: 'SELECT status FROM instances WHERE id = ? AND user_id = ?',
      args: [instanceId, session.user.id],
    })

    if (instanceResult.rows.length === 0) {
      return NextResponse.json({ error: 'Instance not found' }, { status: 404 })
    }

    const status = instanceResult.rows[0].status as string

    if (status !== 'running') {
      return NextResponse.json(
        { error: 'Instance not running', details: `Instance is ${status}. Start the instance to manage auth settings.` },
        { status: 503 }
      )
    }

    const credentials = await getInstanceCredentials(instanceId, session.user.id)

    if (!credentials) {
      return NextResponse.json({ error: 'Instance credentials not found' }, { status: 404 })
    }

    // Fetch the users collection to get auth options
    const collectionResponse = await authenticatedPocketBaseRequest(
      instanceId,
      credentials.admin_email,
      credentials.admin_password,
      'api/collections/users'
    )

    if (!collectionResponse.ok) {
      const errorText = await collectionResponse.text()
      return NextResponse.json(
        { error: 'Failed to fetch auth settings', details: errorText },
        { status: collectionResponse.status }
      )
    }

    const collection = await collectionResponse.json()

    // Fetch instance settings (mail, auth providers, etc.)
    const settingsResponse = await authenticatedPocketBaseRequest(
      instanceId,
      credentials.admin_email,
      credentials.admin_password,
      'api/settings'
    )

    let settings = null
    if (settingsResponse.ok) {
      settings = await settingsResponse.json()
    }

    return NextResponse.json({
      collection,
      settings,
    })
  } catch (error) {
    console.error('Error fetching auth settings:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/instances/[id]/auth-settings
 * Updates auth options on the PocketBase "users" collection and/or instance settings.
 * Body: { collection?: object, settings?: object }
 */
export async function PATCH(
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
      sql: 'SELECT status FROM instances WHERE id = ? AND user_id = ?',
      args: [instanceId, session.user.id],
    })

    if (instanceResult.rows.length === 0) {
      return NextResponse.json({ error: 'Instance not found' }, { status: 404 })
    }

    const status = instanceResult.rows[0].status as string

    if (status !== 'running') {
      return NextResponse.json(
        { error: 'Instance not running', details: `Instance is ${status}. Start the instance to update auth settings.` },
        { status: 503 }
      )
    }

    const credentials = await getInstanceCredentials(instanceId, session.user.id)

    if (!credentials) {
      return NextResponse.json({ error: 'Instance credentials not found' }, { status: 404 })
    }

    const body = await request.json()
    const results: { collection?: any; settings?: any } = {}

    // Update users collection auth options
    if (body.collection) {
      const collectionResponse = await authenticatedPocketBaseRequest(
        instanceId,
        credentials.admin_email,
        credentials.admin_password,
        'api/collections/users',
        {
          method: 'PATCH',
          body: JSON.stringify(body.collection),
        }
      )

      if (!collectionResponse.ok) {
        const errorText = await collectionResponse.text()
        return NextResponse.json(
          { error: 'Failed to update collection auth settings', details: errorText },
          { status: collectionResponse.status }
        )
      }

      results.collection = await collectionResponse.json()
    }

    // Update instance-level settings (mail, OAuth2 providers, etc.)
    if (body.settings) {
      const settingsResponse = await authenticatedPocketBaseRequest(
        instanceId,
        credentials.admin_email,
        credentials.admin_password,
        'api/settings',
        {
          method: 'PATCH',
          body: JSON.stringify(body.settings),
        }
      )

      if (!settingsResponse.ok) {
        const errorText = await settingsResponse.text()
        return NextResponse.json(
          { error: 'Failed to update instance settings', details: errorText },
          { status: settingsResponse.status }
        )
      }

      results.settings = await settingsResponse.json()
    }

    return NextResponse.json(results)
  } catch (error) {
    console.error('Error updating auth settings:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
