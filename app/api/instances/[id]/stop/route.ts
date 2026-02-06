import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/auth-provider'
import { stopRailwayInstance } from '@/lib/railway-client'
import { db } from '@/lib/db'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAuthSession()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const result = await db.execute({
      sql: 'SELECT user_id FROM instances WHERE id = ?',
      args: [id],
    })

    if (result.rows.length === 0 || result.rows[0].user_id !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Stop instance on Railway
    try {
      await stopRailwayInstance(id)
    } catch (error: any) {
      // If Railway service fails (not running, connection error, etc.), 
      // we assume the instance is effectively unreachable/stopped and update DB to reflect reality.
      console.warn(`[Stop] Failed to stop on Railway (proceeding to DB update): ${error.message}`)
    }

    // Update instance status in database
    await db.execute({
      sql: 'UPDATE instances SET status = ?, last_stopped_at = ? WHERE id = ?',
      args: ['stopped', new Date().toISOString(), id],
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Stop instance error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
