import { db } from './db'
import { nanoid } from 'nanoid'
import { createModuleLogger } from './logger'

const log = createModuleLogger('Alerts')

/**
 * Alerting system for instance health and operational issues.
 *
 * Sends notifications to users when critical events occur.
 * Supports email and webhook delivery.
 */

export type AlertType =
  | 'instance_down'
  | 'instance_degraded'
  | 'backup_failed'
  | 'high_error_rate'
  | 'storage_limit'
  | 'rate_limit_exceeded'

export type AlertSeverity = 'info' | 'warning' | 'critical'

export interface Alert {
  id: string
  instanceId: string
  type: AlertType
  severity: AlertSeverity
  title: string
  message: string
  resolved: boolean
  resolvedAt?: string
  createdAt: string
}

export interface AlertChannel {
  id: string
  instanceId: string
  type: 'email' | 'webhook'
  config: {
    email?: string
    webhookUrl?: string
  }
  enabled: boolean
  createdAt: string
}

/**
 * Create a new alert.
 */
export async function createAlert(
  instanceId: string,
  type: AlertType,
  severity: AlertSeverity,
  title: string,
  message: string
): Promise<Alert> {
  const id = nanoid()
  const now = new Date().toISOString()

  await db.execute({
    sql: `INSERT INTO alerts (id, instance_id, type, severity, title, message, resolved, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [id, instanceId, type, severity, title, message, 0, now],
  })

  const alert: Alert = {
    id,
    instanceId,
    type,
    severity,
    title,
    message,
    resolved: false,
    createdAt: now,
  }

  // Send alert notifications
  await sendAlertNotifications(alert)

  return alert
}

/**
 * Resolve an alert.
 */
export async function resolveAlert(alertId: string): Promise<void> {
  const now = new Date().toISOString()

  await db.execute({
    sql: 'UPDATE alerts SET resolved = 1, resolved_at = ? WHERE id = ?',
    args: [now, alertId],
  })
}

/**
 * Get active alerts for an instance.
 */
export async function getActiveAlerts(instanceId: string): Promise<Alert[]> {
  try {
    const result = await db.execute({
      sql: `SELECT id, instance_id, type, severity, title, message, resolved, resolved_at, created_at
            FROM alerts
            WHERE instance_id = ? AND resolved = 0
            ORDER BY created_at DESC`,
      args: [instanceId],
    })

    return result.rows.map(row => ({
      id: row.id as string,
      instanceId: row.instance_id as string,
      type: row.type as AlertType,
      severity: row.severity as AlertSeverity,
      title: row.title as string,
      message: row.message as string,
      resolved: Boolean(row.resolved),
      resolvedAt: row.resolved_at as string | undefined,
      createdAt: row.created_at as string,
    }))
  } catch (error) {
    log.error({ err: error, instanceId }, 'Failed to get active alerts')
    return []
  }
}

/**
 * Get alert history for an instance.
 */
export async function getAlertHistory(
  instanceId: string,
  limit: number = 100
): Promise<Alert[]> {
  try {
    const result = await db.execute({
      sql: `SELECT id, instance_id, type, severity, title, message, resolved, resolved_at, created_at
            FROM alerts
            WHERE instance_id = ?
            ORDER BY created_at DESC
            LIMIT ?`,
      args: [instanceId, limit],
    })

    return result.rows.map(row => ({
      id: row.id as string,
      instanceId: row.instance_id as string,
      type: row.type as AlertType,
      severity: row.severity as AlertSeverity,
      title: row.title as string,
      message: row.message as string,
      resolved: Boolean(row.resolved),
      resolvedAt: row.resolved_at as string | undefined,
      createdAt: row.created_at as string,
    }))
  } catch (error) {
    log.error({ err: error, instanceId }, 'Failed to get alert history')
    return []
  }
}

/**
 * Send alert notifications via configured channels.
 */
async function sendAlertNotifications(alert: Alert): Promise<void> {
  try {
    // Get alert channels for this instance
    const channels = await getAlertChannels(alert.instanceId)

    for (const channel of channels) {
      if (!channel.enabled) continue

      if (channel.type === 'email' && channel.config.email) {
        await sendEmailAlert(channel.config.email, alert)
      } else if (channel.type === 'webhook' && channel.config.webhookUrl) {
        await sendWebhookAlert(channel.config.webhookUrl, alert)
      }
    }
  } catch (error) {
    log.error({ err: error, instanceId: alert.instanceId }, 'Failed to send alert notifications')
  }
}

/**
 * Send alert via email (stub - integrate with your email service).
 */
async function sendEmailAlert(email: string, alert: Alert): Promise<void> {
  // TODO: Integrate with email service (SendGrid, Resend, etc.)
  log.info({ email, alertId: alert.id, alertType: alert.type }, 'Would send email alert')
}

/**
 * Send alert via webhook.
 */
async function sendWebhookAlert(webhookUrl: string, alert: Alert): Promise<void> {
  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        event: 'alert.created',
        alert,
      }),
    })
  } catch (error) {
    log.error({ err: error, alertId: alert.id }, 'Failed to send webhook alert')
  }
}

/**
 * Add an alert channel for an instance.
 */
export async function addAlertChannel(
  instanceId: string,
  type: 'email' | 'webhook',
  config: { email?: string; webhookUrl?: string }
): Promise<AlertChannel> {
  const id = nanoid()
  const now = new Date().toISOString()

  await db.execute({
    sql: `INSERT INTO alert_channels (id, instance_id, type, config, enabled, created_at)
          VALUES (?, ?, ?, ?, ?, ?)`,
    args: [id, instanceId, type, JSON.stringify(config), 1, now],
  })

  return {
    id,
    instanceId,
    type,
    config,
    enabled: true,
    createdAt: now,
  }
}

/**
 * Get alert channels for an instance.
 */
export async function getAlertChannels(instanceId: string): Promise<AlertChannel[]> {
  try {
    const result = await db.execute({
      sql: `SELECT id, instance_id, type, config, enabled, created_at
            FROM alert_channels
            WHERE instance_id = ?`,
      args: [instanceId],
    })

    return result.rows.map(row => ({
      id: row.id as string,
      instanceId: row.instance_id as string,
      type: row.type as 'email' | 'webhook',
      config: JSON.parse(row.config as string),
      enabled: Boolean(row.enabled),
      createdAt: row.created_at as string,
    }))
  } catch (error) {
    log.error({ err: error, instanceId }, 'Failed to get alert channels')
    return []
  }
}

/**
 * Auto-resolve alerts when conditions improve.
 */
export async function checkAndResolveAlerts(instanceId: string): Promise<void> {
  try {
    const activeAlerts = await getActiveAlerts(instanceId)

    for (const alert of activeAlerts) {
      // Auto-resolve instance_down alerts if instance is healthy again
      if (alert.type === 'instance_down') {
        // Check if instance is healthy (you can call health check here)
        // For now, this is a placeholder
        // await resolveAlert(alert.id)
      }
    }
  } catch (error) {
    log.error({ err: error, instanceId }, 'Failed to check and resolve alerts')
  }
}
