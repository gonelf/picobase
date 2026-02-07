import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { getInstanceCredentials } from '@/lib/get-instance-credentials'
import { authenticatedPocketBaseRequest } from '@/lib/pocketbase-auth'
import { db } from '@/lib/db'
import { touchInstanceActivity } from '@/lib/activity'

async function getVerifiedRunningInstance(instanceId: string, userId: string) {
  const instanceResult = await db.execute({
    sql: 'SELECT status FROM instances WHERE id = ? AND user_id = ?',
    args: [instanceId, userId],
  })

  if (instanceResult.rows.length === 0) {
    return { error: 'Instance not found', status: 404 }
  }

  const status = instanceResult.rows[0].status as string

  if (status !== 'running') {
    return { error: 'Instance not running', details: `Instance is ${status}. Start the instance to manage backups.`, status: 503 }
  }

  return { ok: true }
}

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

    const check = await getVerifiedRunningInstance(instanceId, session.user.id)
    if ('error' in check) {
      return NextResponse.json(
        { error: check.error, details: check.details },
        { status: check.status }
      )
    }

    const credentials = await getInstanceCredentials(instanceId, session.user.id)
    if (!credentials) {
      return NextResponse.json({ error: 'Instance credentials not found' }, { status: 404 })
    }

    const response = await authenticatedPocketBaseRequest(
      instanceId,
      credentials.admin_email,
      credentials.admin_password,
      'api/backups'
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Failed to fetch backups: ${response.status} ${errorText}`)
      return NextResponse.json(
        { error: 'Failed to fetch backups', details: errorText },
        { status: response.status }
      )
    }

    const data = await response.json()
    touchInstanceActivity(instanceId).catch(() => {})
    return NextResponse.json(data)

  } catch (error) {
    console.error('Error fetching backups:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
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

    const check = await getVerifiedRunningInstance(instanceId, session.user.id)
    if ('error' in check) {
      return NextResponse.json(
        { error: check.error, details: check.details },
        { status: check.status }
      )
    }

    const credentials = await getInstanceCredentials(instanceId, session.user.id)
    if (!credentials) {
      return NextResponse.json({ error: 'Instance credentials not found' }, { status: 404 })
    }

    const body = await request.json()
    const backupName = body.name || ''

    const response = await authenticatedPocketBaseRequest(
      instanceId,
      credentials.admin_email,
      credentials.admin_password,
      'api/backups',
      {
        method: 'POST',
        body: JSON.stringify({ name: backupName }),
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Failed to create backup: ${response.status} ${errorText}`)
      return NextResponse.json(
        { error: 'Failed to create backup', details: errorText },
        { status: response.status }
      )
    }

    if (response.status === 204) {
      return NextResponse.json({ success: true })
    }

    const data = await response.json()
    return NextResponse.json(data)

  } catch (error) {
    console.error('Error creating backup:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
