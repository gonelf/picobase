import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/auth-provider'
import { startRailwayInstance } from '@/lib/railway-client'
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

    // Verify instance ownership
    const result = await db.execute({
      sql: 'SELECT user_id, port FROM instances WHERE id = ?',
      args: [params.id],
    })

    if (result.rows.length === 0 || result.rows[0].user_id !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const port = result.rows[0].port as number || 8090

    // Start instance on Railway
    const railwayResponse = await startRailwayInstance(params.id, port)

    // Update instance status in database
    await db.execute({
      sql: 'UPDATE instances SET status = ?, last_started_at = ? WHERE id = ?',
      args: ['running', new Date().toISOString(), params.id],
    })

    return NextResponse.json({
      port,
      url: `http://localhost:${port}`,
      ...railwayResponse
    })
  } catch (error) {
    console.error('Start instance error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
