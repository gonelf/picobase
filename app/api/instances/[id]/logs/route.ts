import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { getInstanceCredentials } from '@/lib/get-instance-credentials'
import { authenticatedPocketBaseRequest } from '@/lib/pocketbase-auth'
import { db } from '@/lib/db'
import { touchInstanceActivity } from '@/lib/activity'

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
        { error: 'Instance not running', details: `Instance is ${status}. Start the instance to view logs.` },
        { status: 503 }
      )
    }

    const credentials = await getInstanceCredentials(instanceId, session.user.id)

    if (!credentials) {
      return NextResponse.json({ error: 'Instance credentials not found' }, { status: 404 })
    }

    const url = new URL(request.url)
    const searchParams = url.searchParams.toString()

    const response = await authenticatedPocketBaseRequest(
      instanceId,
      credentials.admin_email,
      credentials.admin_password,
      `api/logs${searchParams ? `?${searchParams}` : ''}`
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Failed to fetch logs: ${response.status} ${errorText}`)
      return NextResponse.json(
        { error: 'Failed to fetch logs', details: errorText },
        { status: response.status }
      )
    }

    const data = await response.json()
    touchInstanceActivity(instanceId).catch(() => {})
    return NextResponse.json(data)

  } catch (error) {
    console.error('Error fetching logs:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
