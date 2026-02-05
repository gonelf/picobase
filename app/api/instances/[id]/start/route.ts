import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/auth-provider'
import { startInstance, getInstanceStatus } from '@/lib/pocketbase'
import { db } from '@/lib/db'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getAuthSession()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const instance = await getInstanceStatus(params.id)

    if (!instance) {
      return NextResponse.json({ error: 'Instance not found' }, { status: 404 })
    }

    const result = await db.execute({
      sql: 'SELECT user_id FROM instances WHERE id = ?',
      args: [params.id],
    })

    if (result.rows.length === 0 || result.rows[0].user_id !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { port, url } = await startInstance(params.id)

    return NextResponse.json({ port, url })
  } catch (error) {
    console.error('Start instance error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
