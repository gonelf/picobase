import { db } from './db'
import { nanoid } from 'nanoid'
import { createModuleLogger } from './logger'

const log = createModuleLogger('AuditLog')

/**
 * Audit logging for admin operations and security events.
 *
 * Tracks all administrative actions for compliance and security.
 * Implements the Phase 5 requirement for audit logging.
 */

export type AuditAction =
  | 'instance.create'
  | 'instance.start'
  | 'instance.stop'
  | 'instance.delete'
  | 'api_key.create'
  | 'api_key.rotate'
  | 'api_key.delete'
  | 'backup.create'
  | 'backup.restore'
  | 'backup.delete'
  | 'settings.update'
  | 'user.login'
  | 'user.logout'
  | 'alert_channel.create'
  | 'alert_channel.delete'
  | 'ip_allowlist.add'
  | 'ip_allowlist.remove'

export interface AuditLogEntry {
  id: string
  userId: string
  instanceId?: string
  action: AuditAction
  resourceType: string
  resourceId?: string
  metadata?: Record<string, any>
  ipAddress?: string
  userAgent?: string
  createdAt: string
}

/**
 * Log an audit event.
 */
export async function logAuditEvent(
  userId: string,
  action: AuditAction,
  resourceType: string,
  options?: {
    instanceId?: string
    resourceId?: string
    metadata?: Record<string, any>
    ipAddress?: string
    userAgent?: string
  }
): Promise<void> {
  try {
    const id = nanoid()
    const now = new Date().toISOString()

    await db.execute({
      sql: `INSERT INTO audit_logs
            (id, user_id, instance_id, action, resource_type, resource_id, metadata, ip_address, user_agent, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        id,
        userId,
        options?.instanceId || null,
        action,
        resourceType,
        options?.resourceId || null,
        options?.metadata ? JSON.stringify(options.metadata) : null,
        options?.ipAddress || null,
        options?.userAgent || null,
        now,
      ],
    })
  } catch (error) {
    // Audit logging failures should not break operations, but should be logged
    log.error({ err: error, userId, action, resourceType }, 'Failed to log audit event')
  }
}

/**
 * Get audit logs for an instance.
 */
export async function getAuditLogs(
  instanceId: string,
  options?: {
    limit?: number
    offset?: number
    action?: AuditAction
    userId?: string
  }
): Promise<AuditLogEntry[]> {
  try {
    const limit = options?.limit || 100
    const offset = options?.offset || 0

    let sql = `SELECT id, user_id, instance_id, action, resource_type, resource_id, metadata, ip_address, user_agent, created_at
               FROM audit_logs
               WHERE instance_id = ?`
    const args: any[] = [instanceId]

    if (options?.action) {
      sql += ' AND action = ?'
      args.push(options.action)
    }

    if (options?.userId) {
      sql += ' AND user_id = ?'
      args.push(options.userId)
    }

    sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?'
    args.push(limit, offset)

    const result = await db.execute({ sql, args })

    return result.rows.map(row => ({
      id: row.id as string,
      userId: row.user_id as string,
      instanceId: row.instance_id as string | undefined,
      action: row.action as AuditAction,
      resourceType: row.resource_type as string,
      resourceId: row.resource_id as string | undefined,
      metadata: row.metadata ? JSON.parse(row.metadata as string) : undefined,
      ipAddress: row.ip_address as string | undefined,
      userAgent: row.user_agent as string | undefined,
      createdAt: row.created_at as string,
    }))
  } catch (error) {
    log.error({ err: error, instanceId }, 'Failed to get audit logs')
    return []
  }
}

/**
 * Get audit logs for a user across all instances.
 */
export async function getUserAuditLogs(
  userId: string,
  limit: number = 100
): Promise<AuditLogEntry[]> {
  try {
    const result = await db.execute({
      sql: `SELECT id, user_id, instance_id, action, resource_type, resource_id, metadata, ip_address, user_agent, created_at
            FROM audit_logs
            WHERE user_id = ?
            ORDER BY created_at DESC
            LIMIT ?`,
      args: [userId, limit],
    })

    return result.rows.map(row => ({
      id: row.id as string,
      userId: row.user_id as string,
      instanceId: row.instance_id as string | undefined,
      action: row.action as AuditAction,
      resourceType: row.resource_type as string,
      resourceId: row.resource_id as string | undefined,
      metadata: row.metadata ? JSON.parse(row.metadata as string) : undefined,
      ipAddress: row.ip_address as string | undefined,
      userAgent: row.user_agent as string | undefined,
      createdAt: row.created_at as string,
    }))
  } catch (error) {
    log.error({ err: error, userId }, 'Failed to get user audit logs')
    return []
  }
}

/**
 * Clean up old audit logs to prevent database bloat.
 */
export async function cleanupOldAuditLogs(daysToKeep: number = 90): Promise<void> {
  try {
    const cutoffTimestamp = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000).toISOString()

    const result = await db.execute({
      sql: 'DELETE FROM audit_logs WHERE created_at < ?',
      args: [cutoffTimestamp],
    })

    log.info({ daysToKeep }, 'Cleaned up old audit logs')
  } catch (error) {
    log.error({ err: error, daysToKeep }, 'Failed to cleanup old audit logs')
  }
}

/**
 * Export audit logs for compliance (CSV format).
 */
export async function exportAuditLogs(
  instanceId: string,
  startDate: string,
  endDate: string
): Promise<string> {
  try {
    const result = await db.execute({
      sql: `SELECT id, user_id, instance_id, action, resource_type, resource_id, metadata, ip_address, user_agent, created_at
            FROM audit_logs
            WHERE instance_id = ? AND created_at BETWEEN ? AND ?
            ORDER BY created_at ASC`,
      args: [instanceId, startDate, endDate],
    })

    // Generate CSV
    const headers = ['ID', 'User ID', 'Instance ID', 'Action', 'Resource Type', 'Resource ID', 'IP Address', 'User Agent', 'Created At']
    const rows = result.rows.map(row => [
      row.id,
      row.user_id,
      row.instance_id || '',
      row.action,
      row.resource_type,
      row.resource_id || '',
      row.ip_address || '',
      row.user_agent || '',
      row.created_at,
    ])

    const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n')

    return csv
  } catch (error) {
    log.error({ err: error, instanceId, startDate, endDate }, 'Failed to export audit logs')
    return ''
  }
}
