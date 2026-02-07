import { NextRequest, NextResponse } from 'next/server'
import { findIdleInstances } from '@/lib/activity'
import { stopRailwayInstance } from '@/lib/railway-client'
import { db } from '@/lib/db'

const CRON_SECRET = process.env.CRON_SECRET

const IDLE_THRESHOLD_MS = 48 * 60 * 60 * 1000 // 48 hours

/**
 * Cron endpoint to pause instances that have been idle for 48+ hours.
 * Call this on a schedule (e.g., every hour via Vercel Cron).
 *
 * Requires CRON_SECRET env var for authentication.
 * Pass it as: Authorization: Bearer <CRON_SECRET>
 */
export async function POST(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization')
    if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const idleInstances = await findIdleInstances(IDLE_THRESHOLD_MS)

    if (idleInstances.length === 0) {
      return NextResponse.json({ message: 'No idle instances found', paused: 0 })
    }

    const results: Array<{ id: string; success: boolean; error?: string }> = []

    for (const instance of idleInstances) {
      try {
        // Stop on Railway
        try {
          await stopRailwayInstance(instance.id)
        } catch (error: any) {
          console.warn(`[PauseIdle] Failed to stop ${instance.id} on Railway: ${error.message}`)
        }

        // Update DB status
        await db.execute({
          sql: 'UPDATE instances SET status = ?, last_stopped_at = ? WHERE id = ?',
          args: ['stopped', new Date().toISOString(), instance.id],
        })

        console.log(`[PauseIdle] Paused idle instance ${instance.id} (last activity: ${instance.last_activity_at || 'never'})`)
        results.push({ id: instance.id, success: true })
      } catch (error: any) {
        console.error(`[PauseIdle] Failed to pause ${instance.id}:`, error)
        results.push({ id: instance.id, success: false, error: error.message })
      }
    }

    const paused = results.filter(r => r.success).length
    return NextResponse.json({
      message: `Paused ${paused} idle instance(s)`,
      paused,
      total: idleInstances.length,
      results,
    })
  } catch (error) {
    console.error('[PauseIdle] Cron error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
