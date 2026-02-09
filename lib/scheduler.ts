import { db } from './db'
import { checkInstanceHealth, recordHealthCheck } from './health-monitor'
import { getInstancesDueForBackup, executeScheduledBackup, cleanupOldBackups } from './backup-scheduler'
import { cleanupOldMetrics } from './metrics'
import { cleanupOldAuditLogs } from './audit-log'
import { createAlert, checkAndResolveAlerts } from './alerts'
import { shouldTriggerAlert } from './health-monitor'
import { createModuleLogger } from './logger'

const log = createModuleLogger('Scheduler')

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
    log.info('Running health checks')

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

    log.info({ count: result.rows.length }, 'Completed health checks')
  } catch (error) {
    log.error({ err: error }, 'Health check failed')
  }
}

/**
 * Run automated backups for instances with scheduled backups.
 */
export async function runScheduledBackups(): Promise<void> {
  try {
    log.info('Running scheduled backups')

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

    log.info({ count: instanceIds.length }, 'Completed scheduled backups')
  } catch (error) {
    log.error({ err: error }, 'Scheduled backup failed')
  }
}

/**
 * Clean up old data to prevent database bloat.
 */
export async function runCleanup(): Promise<void> {
  try {
    log.info('Running cleanup tasks')

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

    log.info('Cleanup tasks completed')
  } catch (error) {
    log.error({ err: error }, 'Cleanup failed')
  }
}

/**
 * Main scheduler entry point.
 * Call this from a cron job or Vercel Cron.
 */
export async function runScheduledTasks(task: 'health' | 'backup' | 'cleanup' | 'all'): Promise<void> {
  log.info({ task }, 'Starting scheduled task')

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
    log.info({ task, duration }, 'Task completed')
  } catch (error) {
    log.error({ task, err: error }, 'Task failed')
    throw error
  }
}
