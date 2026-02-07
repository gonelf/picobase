import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/auth-provider'
import { startRailwayInstance } from '@/lib/railway-client'
import { db } from '@/lib/db'
import { ensureInstancePort } from '@/lib/instance-management'

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

    // Verify instance ownership and get admin credentials
    const result = await db.execute({
      sql: 'SELECT user_id, port, admin_email, admin_password FROM instances WHERE id = ?',
      args: [id],
    })

    if (result.rows.length === 0 || result.rows[0].user_id !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const instance = result.rows[0] as any

    // Dynamic Port Allocation
    // 1. Get all ports currently used by running instances
    const usedPortsResult = await db.execute('SELECT port FROM instances WHERE status = "running" AND port IS NOT NULL')
    const usedPorts = new Set(usedPortsResult.rows.map(row => row.port as number))

    // 2. Determine port for this instance
    let port = instance.port as number

    // If port is undefined, null, or already in use by another running instance, assign a new one
    if (!port || usedPorts.has(port)) {
      // Find first available port starting from 8090
      let candidate = 8090
      while (usedPorts.has(candidate)) {
        candidate++
      }
      port = candidate
    }

    // Start instance on Railway with admin credentials
    const railwayResponse = await startRailwayInstance(
      id,
      port,
      instance.admin_email,
      instance.admin_password
    )

    // Update instance status in database with the assigned port
    await db.execute({
      sql: 'UPDATE instances SET status = ?, port = ?, last_started_at = ? WHERE id = ?',
      args: ['running', port, new Date().toISOString(), id],
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
