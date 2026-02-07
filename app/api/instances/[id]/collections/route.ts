import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { getInstanceCredentials } from '@/lib/get-instance-credentials'
import { authenticatedPocketBaseRequest } from '@/lib/pocketbase-auth'
import { db } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id: instanceId } = await params

    // Check instance status first
    const instanceResult = await db.execute({
      sql: 'SELECT status FROM instances WHERE id = ? AND user_id = ?',
      args: [instanceId, session.user.id],
    })

    if (instanceResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Instance not found' },
        { status: 404 }
      )
    }

    const status = instanceResult.rows[0].status as string

    if (status !== 'running') {
      return NextResponse.json(
        { error: 'Instance not running', details: `Instance is ${status}. Start the instance to view collections.` },
        { status: 503 }
      )
    }

    // Get instance credentials
    const credentials = await getInstanceCredentials(instanceId, session.user.id)

    if (!credentials) {
      return NextResponse.json(
        { error: 'Instance credentials not found' },
        { status: 404 }
      )
    }

    // Make authenticated request to PocketBase
    const response = await authenticatedPocketBaseRequest(
      instanceId,
      credentials.admin_email,
      credentials.admin_password,
      'api/collections'
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Failed to fetch collections: ${response.status} ${errorText}`)
      return NextResponse.json(
        { error: 'Failed to fetch collections', details: errorText },
        { status: response.status }
      )
    }

    const data = await response.json()
    const collections = Array.isArray(data) ? data : (data.items || [])
    return NextResponse.json(collections)

  } catch (error) {
    console.error('Error fetching collections:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
