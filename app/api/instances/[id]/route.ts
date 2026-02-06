import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/auth-provider'
import { deleteRailwayInstance } from '@/lib/railway-client'
import { db } from '@/lib/db'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAuthSession()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Delete instance from Railway
    await deleteRailwayInstance(id)

    // Cleanup database
    await db.execute({
      sql: 'DELETE FROM api_keys WHERE instance_id = ?',
      args: [id],
    })

    await db.execute({
      sql: 'DELETE FROM instances WHERE id = ? AND user_id = ?',
      args: [id, session.user.id],
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete instance error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
