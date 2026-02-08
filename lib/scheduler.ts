import { db } from './db'
import { checkInstanceHealth, recordHealthCheck } from './health-monitor'
import { getInstancesDueForBackup, executeScheduledBackup, cleanupOldBackups } from './backup-scheduler'
import { cleanupOldMetrics } from './metrics'
import { cleanupOldAuditLogs } from './audit-log'
import { createAlert, checkAndResolveAlerts } from './alerts'
import { shouldTriggerAlert } from './health-monitor'

/**
 * Scheduled task runner for PicoBase.
 *
 * Runs periodic tasks like health checks, automated backups, and cleanup.
 * Can be triggered by cron or Vercel Cron Jobs.
 */

/**
 * Run health checks for all active instances.
 */
export async function runHealthChecks(): Promise<void> {
  try {
    console.log('[Scheduler] Running health checks...')

    // Get all running instances
    const result = await db.execute({
      sql: `SELECT id, subdomain FROM instances WHERE status = 'running'`,
      args: [],
    })

    for (const row of result.rows) {
      const instanceId = row.id as string
      const subdomain = row.subdomain as string
      const instanceUrl = `https://${subdomain}.picobase.com`

      // Perform health check
      const healthResult = await checkInstanceHealth(instanceId, instanceUrl)
      await recordHealthCheck(healthResult)

      // Check if we need to trigger an alert
      if (healthResult.status === 'unhealthy') {
        const shouldAlert = await shouldTriggerAlert(instanceId)

        if (shouldAlert) {
          await createAlert(
            instanceId,
            'instance_down',
            'critical',
            'Instance is down',
            `Instance ${subdomain} has failed 5 consecutive health checks. Response time: ${healthResult.responseTimeMs}ms. Error: ${healthResult.errorMessage || 'Unknown'}`
          )
        }
      } else {
        // Auto-resolve any existing alerts
        await checkAndResolveAlerts(instanceId)
      }
    }

    console.log(`[Scheduler] Completed health checks for ${result.rows.length} instances`)
  } catch (error) {
    console.error('[Scheduler] Health check failed:', error)
  }
}

/**
 * Run automated backups for instances with scheduled backups.
 */
export async function runScheduledBackups(): Promise<void> {
  try {
    console.log('[Scheduler] Running scheduled backups...')

    const instanceIds = await getInstancesDueForBackup()

    for (const instanceId of instanceIds) {
      const success = await executeScheduledBackup(instanceId)

      if (!success) {
        await createAlert(
          instanceId,
          'backup_failed',
          'warning',
          'Scheduled backup failed',
          `Automated backup for instance ${instanceId} failed. Please check instance status and logs.`
        )
      }
    }

    console.log(`[Scheduler] Completed scheduled backups for ${instanceIds.length} instances`)
  } catch (error) {
    console.error('[Scheduler] Scheduled backup failed:', error)
  }
}

/**
 * Clean up old data to prevent database bloat.
 */
export async function runCleanup(): Promise<void> {
  try {
    console.log('[Scheduler] Running cleanup tasks...')

    // Clean up old metrics (keep 30 days)
    await cleanupOldMetrics(30)

    // Clean up old audit logs (keep 90 days)
    await cleanupOldAuditLogs(90)

    // Clean up old backups based on retention policies
    const result = await db.execute({
      sql: 'SELECT DISTINCT instance_id FROM backup_schedules WHERE enabled = 1',
      args: [],
    })

    for (const row of result.rows) {
      await cleanupOldBackups(row.instance_id as string)
    }

    console.log('[Scheduler] Cleanup tasks completed')
  } catch (error) {
    console.error('[Scheduler] Cleanup failed:', error)
  }
}

/**
 * Main scheduler entry point.
 * Call this from a cron job or Vercel Cron.
 */
export async function runScheduledTasks(task: 'health' | 'backup' | 'cleanup' | 'all'): Promise<void> {
  console.log(`[Scheduler] Starting scheduled task: ${task}`)

  const startTime = Date.now()

  try {
    switch (task) {
      case 'health':
        await runHealthChecks()
        break

      case 'backup':
        await runScheduledBackups()
        break

      case 'cleanup':
        await runCleanup()
        break

      case 'all':
        await runHealthChecks()
        await runScheduledBackups()
        await runCleanup()
        break
    }

    const duration = Date.now() - startTime
    console.log(`[Scheduler] Task ${task} completed in ${duration}ms`)
  } catch (error) {
    console.error(`[Scheduler] Task ${task} failed:`, error)
    throw error
  }
}
