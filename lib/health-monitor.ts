import { db } from './db'
import { nanoid } from 'nanoid'
import { getInstanceCredentials } from './get-instance-credentials'

/**
 * Health monitoring service for PicoBase instances.
 *
 * Periodically checks instance health and records metrics.
 * Triggers alerts when instances become unhealthy.
 */

export interface HealthCheckResult {
  instanceId: string
  status: 'healthy' | 'unhealthy' | 'degraded'
  responseTimeMs: number
  timestamp: string
  errorMessage?: string
}

export interface HealthMetrics {
  instanceId: string
  avgResponseTime: number
  errorRate: number
  uptime: number
  lastCheckAt: string
}

/**
 * Perform a health check on an instance by pinging its health endpoint.
 */
export async function checkInstanceHealth(instanceId: string, instanceUrl: string): Promise<HealthCheckResult> {
  const startTime = Date.now()
  const timestamp = new Date().toISOString()

  try {
    // Ping the PocketBase health endpoint
    const response = await fetch(`${instanceUrl}/api/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(10000), // 10 second timeout
    })

    const responseTimeMs = Date.now() - startTime

    if (response.ok) {
      return {
        instanceId,
        status: responseTimeMs > 2000 ? 'degraded' : 'healthy',
        responseTimeMs,
        timestamp,
      }
    } else {
      return {
        instanceId,
        status: 'unhealthy',
        responseTimeMs,
        timestamp,
        errorMessage: `HTTP ${response.status}`,
      }
    }
  } catch (error) {
    const responseTimeMs = Date.now() - startTime
    return {
      instanceId,
      status: 'unhealthy',
      responseTimeMs,
      timestamp,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Record a health check result to the database.
 */
export async function recordHealthCheck(result: HealthCheckResult): Promise<void> {
  try {
    await db.execute({
      sql: `INSERT INTO health_checks
            (id, instance_id, status, response_time_ms, error_message, checked_at)
            VALUES (?, ?, ?, ?, ?, ?)`,
      args: [
        nanoid(),
        result.instanceId,
        result.status,
        result.responseTimeMs,
        result.errorMessage || null,
        result.timestamp,
      ],
    })
  } catch (error) {
    console.error('[HealthMonitor] Failed to record health check:', error)
  }
}

/**
 * Get health metrics for an instance over a time period.
 */
export async function getHealthMetrics(
  instanceId: string,
  hoursBack: number = 24
): Promise<HealthMetrics | null> {
  try {
    const sinceTimestamp = new Date(Date.now() - hoursBack * 60 * 60 * 1000).toISOString()

    const result = await db.execute({
      sql: `SELECT
              AVG(response_time_ms) as avg_response_time,
              SUM(CASE WHEN status = 'unhealthy' THEN 1 ELSE 0 END) * 100.0 / COUNT(*) as error_rate,
              SUM(CASE WHEN status = 'healthy' THEN 1 ELSE 0 END) * 100.0 / COUNT(*) as uptime,
              MAX(checked_at) as last_check_at
            FROM health_checks
            WHERE instance_id = ? AND checked_at >= ?`,
      args: [instanceId, sinceTimestamp],
    })

    if (result.rows.length === 0 || !result.rows[0].last_check_at) {
      return null
    }

    const row = result.rows[0]

    return {
      instanceId,
      avgResponseTime: Number(row.avg_response_time) || 0,
      errorRate: Number(row.error_rate) || 0,
      uptime: Number(row.uptime) || 0,
      lastCheckAt: row.last_check_at as string,
    }
  } catch (error) {
    console.error('[HealthMonitor] Failed to get health metrics:', error)
    return null
  }
}

/**
 * Get recent health checks for an instance.
 */
export async function getRecentHealthChecks(
  instanceId: string,
  limit: number = 50
): Promise<HealthCheckResult[]> {
  try {
    const result = await db.execute({
      sql: `SELECT instance_id, status, response_time_ms, error_message, checked_at as timestamp
            FROM health_checks
            WHERE instance_id = ?
            ORDER BY checked_at DESC
            LIMIT ?`,
      args: [instanceId, limit],
    })

    return result.rows.map(row => ({
      instanceId: row.instance_id as string,
      status: row.status as 'healthy' | 'unhealthy' | 'degraded',
      responseTimeMs: row.response_time_ms as number,
      timestamp: row.timestamp as string,
      errorMessage: row.error_message as string | undefined,
    }))
  } catch (error) {
    console.error('[HealthMonitor] Failed to get recent health checks:', error)
    return []
  }
}

/**
 * Check if an instance needs an alert based on recent health checks.
 */
export async function shouldTriggerAlert(instanceId: string): Promise<boolean> {
  try {
    // Get last 5 health checks
    const result = await db.execute({
      sql: `SELECT status FROM health_checks
            WHERE instance_id = ?
            ORDER BY checked_at DESC
            LIMIT 5`,
      args: [instanceId],
    })

    if (result.rows.length < 5) {
      return false
    }

    // Trigger alert if all last 5 checks were unhealthy
    const allUnhealthy = result.rows.every(row => row.status === 'unhealthy')
    return allUnhealthy
  } catch (error) {
    console.error('[HealthMonitor] Failed to check alert threshold:', error)
    return false
  }
}
