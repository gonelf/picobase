import { db } from './db'
import { createModuleLogger } from './logger'

const log = createModuleLogger('Activity')

/**
 * In-memory cache to debounce activity updates.
 * Only writes to DB at most once per DEBOUNCE_MS per instance.
 */
const lastTouched = new Map<string, number>()
const DEBOUNCE_MS = 60_000 // 1 minute

/**
 * Record activity for an instance. Debounced to avoid excessive DB writes.
 * Called from proxy routes and dashboard API routes.
 */
export async function touchInstanceActivity(instanceId: string): Promise<void> {
  const now = Date.now()
  const last = lastTouched.get(instanceId) || 0

  if (now - last < DEBOUNCE_MS) {
    return // Skip - too recent
  }

  lastTouched.set(instanceId, now)

  try {
    await db.execute({
      sql: 'UPDATE instances SET last_activity_at = ? WHERE id = ?',
      args: [new Date(now).toISOString(), instanceId],
    })
  } catch (error) {
    // Non-critical - don't let activity tracking break requests
    log.error({ err: error, instanceId }, 'Failed to update activity')
  }
}

/**
 * Find all running instances that have been idle for longer than the given duration.
 * @param idleMs - Idle threshold in milliseconds (default: 48 hours)
 * @returns List of instance IDs that should be paused
 */
export async function findIdleInstances(idleMs: number = 48 * 60 * 60 * 1000): Promise<Array<{ id: string; last_activity_at: string | null }>> {
  const cutoff = new Date(Date.now() - idleMs).toISOString()

  const result = await db.execute({
    sql: `SELECT id, last_activity_at FROM instances
          WHERE status = 'running'
          AND (last_activity_at IS NULL OR last_activity_at < ?)
          AND (last_started_at IS NULL OR last_started_at < ?)`,
    args: [cutoff, cutoff],
  })

  return result.rows.map(row => ({
    id: row.id as string,
    last_activity_at: row.last_activity_at as string | null,
  }))
}
