import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { stopInstance } from '@/lib/pocketbase'
import { db } from '@/lib/db'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const result = await db.execute({
      sql: 'SELECT user_id FROM instances WHERE id = ?',
      args: [params.id],
    })

    if (result.rows.length === 0 || result.rows[0].user_id !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await stopInstance(params.id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Stop instance error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
