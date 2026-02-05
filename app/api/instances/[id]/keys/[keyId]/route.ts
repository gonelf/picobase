import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { deleteApiKey } from '@/lib/api-keys'
import { db } from '@/lib/db'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; keyId: string } }
) {
  try {
    const session = await getSession()

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

    await deleteApiKey(params.keyId, params.id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete API key error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
