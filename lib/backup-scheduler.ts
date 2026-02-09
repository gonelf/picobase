import { db } from './db'
import { nanoid } from 'nanoid'
import { getInstanceCredentials } from './get-instance-credentials'
import { authenticatedPocketBaseRequest } from './pocketbase-auth'
import { createModuleLogger } from './logger'

const log = createModuleLogger('BackupScheduler')

/**
 * Automated backup scheduling for PicoBase instances.
 *
 * Supports periodic backups to R2 with configurable retention.
 * Implements the Phase 5 requirement for automated backups.
 */

export interface BackupSchedule {
  id: string
  instanceId: string
  enabled: boolean
  intervalHours: number
  retentionDays: number
  lastBackupAt?: string
  nextBackupAt: string
  createdAt: string
  updatedAt: string
}

export interface BackupRecord {
  id: string
  instanceId: string
  backupName: string
  sizeBytes: number
  status: 'pending' | 'completed' | 'failed'
  errorMessage?: string
  createdAt: string
}

/**
 * Create or update a backup schedule for an instance.
 */
export async function setBackupSchedule(
  instanceId: string,
  intervalHours: number = 6,
  retentionDays: number = 30,
  enabled: boolean = true
): Promise<BackupSchedule> {
  const id = nanoid()
  const now = new Date().toISOString()
  const nextBackupAt = new Date(Date.now() + intervalHours * 60 * 60 * 1000).toISOString()

  // Check if schedule exists
  const existing = await db.execute({
    sql: 'SELECT id FROM backup_schedules WHERE instance_id = ?',
    args: [instanceId],
  })

  if (existing.rows.length > 0) {
    // Update existing
    await db.execute({
      sql: `UPDATE backup_schedules
            SET enabled = ?, interval_hours = ?, retention_days = ?, next_backup_at = ?, updated_at = ?
            WHERE instance_id = ?`,
      args: [enabled ? 1 : 0, intervalHours, retentionDays, nextBackupAt, now, instanceId],
    })

    return getBackupSchedule(instanceId) as Promise<BackupSchedule>
  } else {
    // Create new
    await db.execute({
      sql: `INSERT INTO backup_schedules
            (id, instance_id, enabled, interval_hours, retention_days, next_backup_at, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [id, instanceId, enabled ? 1 : 0, intervalHours, retentionDays, nextBackupAt, now, now],
    })

    return {
      id,
      instanceId,
      enabled,
      intervalHours,
      retentionDays,
      nextBackupAt,
      createdAt: now,
      updatedAt: now,
    }
  }
}

/**
 * Get backup schedule for an instance.
 */
export async function getBackupSchedule(instanceId: string): Promise<BackupSchedule | null> {
  try {
    const result = await db.execute({
      sql: `SELECT id, instance_id, enabled, interval_hours, retention_days, last_backup_at, next_backup_at, created_at, updated_at
            FROM backup_schedules
            WHERE instance_id = ?`,
      args: [instanceId],
    })

    if (result.rows.length === 0) {
      return null
    }

    const row = result.rows[0]
    return {
      id: row.id as string,
      instanceId: row.instance_id as string,
      enabled: Boolean(row.enabled),
      intervalHours: row.interval_hours as number,
      retentionDays: row.retention_days as number,
      lastBackupAt: row.last_backup_at as string | undefined,
      nextBackupAt: row.next_backup_at as string,
      createdAt: row.created_at as string,
      updatedAt: row.updated_at as string,
    }
  } catch (error) {
    log.error({ err: error, instanceId }, 'Failed to get backup schedule')
    return null
  }
}

/**
 * Execute a scheduled backup for an instance.
 */
export async function executeScheduledBackup(instanceId: string): Promise<boolean> {
  try {
    // Get instance credentials
    const result = await db.execute({
      sql: 'SELECT user_id, status FROM instances WHERE id = ?',
      args: [instanceId],
    })

    if (result.rows.length === 0 || result.rows[0].status !== 'running') {
      log.info({ instanceId }, 'Skipping backup - instance not running')
      return false
    }

    const userId = result.rows[0].user_id as string
    const credentials = await getInstanceCredentials(instanceId, userId)

    if (!credentials) {
      log.error({ instanceId }, 'No credentials found for instance')
      return false
    }

    // Create backup via PocketBase API
    const backupName = `auto-${new Date().toISOString().replace(/[:.]/g, '-')}`
    const response = await authenticatedPocketBaseRequest(
      instanceId,
      credentials.admin_email,
      credentials.admin_password,
      'api/backups',
      {
        method: 'POST',
        body: JSON.stringify({ name: backupName }),
      }
    )

    if (!response.ok) {
      throw new Error(`Backup failed: ${response.status} ${await response.text()}`)
    }

    // Record backup success
    const now = new Date().toISOString()
    await db.execute({
      sql: `INSERT INTO backup_records (id, instance_id, backup_name, size_bytes, status, created_at)
            VALUES (?, ?, ?, ?, ?, ?)`,
      args: [nanoid(), instanceId, backupName, 0, 'completed', now],
    })

    // Update schedule
    const schedule = await getBackupSchedule(instanceId)
    if (schedule) {
      const nextBackupAt = new Date(Date.now() + schedule.intervalHours * 60 * 60 * 1000).toISOString()
      await db.execute({
        sql: 'UPDATE backup_schedules SET last_backup_at = ?, next_backup_at = ? WHERE instance_id = ?',
        args: [now, nextBackupAt, instanceId],
      })
    }

    log.info({ instanceId }, 'Successfully created backup')
    return true
  } catch (error) {
    log.error({ err: error, instanceId }, 'Failed to execute backup')

    // Record failure
    await db.execute({
      sql: `INSERT INTO backup_records (id, instance_id, backup_name, size_bytes, status, error_message, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: [
        nanoid(),
        instanceId,
        `failed-${Date.now()}`,
        0,
        'failed',
        error instanceof Error ? error.message : String(error),
        new Date().toISOString(),
      ],
    })

    return false
  }
}

/**
 * Get all instances that need backups now.
 */
export async function getInstancesDueForBackup(): Promise<string[]> {
  try {
    const now = new Date().toISOString()

    const result = await db.execute({
      sql: `SELECT instance_id FROM backup_schedules
            WHERE enabled = 1 AND next_backup_at <= ?`,
      args: [now],
    })

    return result.rows.map(row => row.instance_id as string)
  } catch (error) {
    log.error({ err: error }, 'Failed to get instances due for backup')
    return []
  }
}

/**
 * Clean up old backups based on retention policy.
 */
export async function cleanupOldBackups(instanceId: string): Promise<void> {
  try {
    const schedule = await getBackupSchedule(instanceId)
    if (!schedule) return

    const cutoffDate = new Date(Date.now() - schedule.retentionDays * 24 * 60 * 60 * 1000).toISOString()

    await db.execute({
      sql: 'DELETE FROM backup_records WHERE instance_id = ? AND created_at < ?',
      args: [instanceId, cutoffDate],
    })

    log.info({ instanceId }, 'Cleaned up old backups')
  } catch (error) {
    log.error({ err: error, instanceId }, 'Failed to cleanup old backups')
  }
}

/**
 * Get backup history for an instance.
 */
export async function getBackupHistory(
  instanceId: string,
  limit: number = 50
): Promise<BackupRecord[]> {
  try {
    const result = await db.execute({
      sql: `SELECT id, instance_id, backup_name, size_bytes, status, error_message, created_at
            FROM backup_records
            WHERE instance_id = ?
            ORDER BY created_at DESC
            LIMIT ?`,
      args: [instanceId, limit],
    })

    return result.rows.map(row => ({
      id: row.id as string,
      instanceId: row.instance_id as string,
      backupName: row.backup_name as string,
      sizeBytes: row.size_bytes as number,
      status: row.status as 'pending' | 'completed' | 'failed',
      errorMessage: row.error_message as string | undefined,
      createdAt: row.created_at as string,
    }))
  } catch (error) {
    log.error({ err: error, instanceId }, 'Failed to get backup history')
    return []
  }
}
