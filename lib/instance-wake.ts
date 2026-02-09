import { db } from './db'
import { startRailwayInstance } from './railway-client'
import { ensureInstancePort } from './instance-management'

/**
 * Attempt to wake a paused/stopped Railway instance.
 *
 * Railway may pause PocketBase processes independently of PicoBase's
 * 48-hour idle cron. This utility restarts the process and updates
 * the DB so subsequent requests succeed.
 *
 * @returns true if the start command was sent successfully
 */
export async function wakeInstance(instanceId: string): Promise<boolean> {
  try {
    // Get instance details needed for startup
    const result = await db.execute({
      sql: 'SELECT port, admin_email, admin_password FROM instances WHERE id = ?',
      args: [instanceId],
    })

    if (result.rows.length === 0) {
      console.error(`[Wake] Instance ${instanceId} not found in DB`)
      return false
    }

    const instance = result.rows[0]

    // Ensure a valid, non-conflicting port
    const port = await ensureInstancePort(instanceId, (instance.port as number) || 8090)

    // Send start command to Railway
    await startRailwayInstance(
      instanceId,
      port,
      instance.admin_email as string,
      instance.admin_password as string,
    )

    // Update DB status so other code paths know it's running
    const now = new Date().toISOString()
    await db.execute({
      sql: 'UPDATE instances SET status = ?, port = ?, last_started_at = ?, last_activity_at = ? WHERE id = ?',
      args: ['running', port, now, now, instanceId],
    })

    console.log(`[Wake] Successfully sent start command for instance ${instanceId} on port ${port}`)
    return true
  } catch (error) {
    console.error(`[Wake] Failed to wake instance ${instanceId}:`, error)
    return false
  }
}
