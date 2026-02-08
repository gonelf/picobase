import { db } from './db'
import { nanoid } from 'nanoid'

/**
 * IP allowlisting for API access control.
 *
 * Restricts API access to specific IP addresses or CIDR ranges.
 * Implements the Phase 5 requirement for IP-based access control.
 */

export interface IpAllowlistEntry {
  id: string
  instanceId: string
  ipAddress: string
  cidr?: string
  description?: string
  enabled: boolean
  createdAt: string
}

/**
 * Add an IP address to the allowlist.
 */
export async function addIpToAllowlist(
  instanceId: string,
  ipAddress: string,
  options?: {
    cidr?: string
    description?: string
  }
): Promise<IpAllowlistEntry> {
  const id = nanoid()
  const now = new Date().toISOString()

  await db.execute({
    sql: `INSERT INTO ip_allowlist (id, instance_id, ip_address, cidr, description, enabled, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?)`,
    args: [
      id,
      instanceId,
      ipAddress,
      options?.cidr || null,
      options?.description || null,
      1,
      now,
    ],
  })

  return {
    id,
    instanceId,
    ipAddress,
    cidr: options?.cidr,
    description: options?.description,
    enabled: true,
    createdAt: now,
  }
}

/**
 * Remove an IP address from the allowlist.
 */
export async function removeIpFromAllowlist(id: string, instanceId: string): Promise<void> {
  await db.execute({
    sql: 'DELETE FROM ip_allowlist WHERE id = ? AND instance_id = ?',
    args: [id, instanceId],
  })
}

/**
 * Get all IP allowlist entries for an instance.
 */
export async function getIpAllowlist(instanceId: string): Promise<IpAllowlistEntry[]> {
  try {
    const result = await db.execute({
      sql: `SELECT id, instance_id, ip_address, cidr, description, enabled, created_at
            FROM ip_allowlist
            WHERE instance_id = ?
            ORDER BY created_at DESC`,
      args: [instanceId],
    })

    return result.rows.map(row => ({
      id: row.id as string,
      instanceId: row.instance_id as string,
      ipAddress: row.ip_address as string,
      cidr: row.cidr as string | undefined,
      description: row.description as string | undefined,
      enabled: Boolean(row.enabled),
      createdAt: row.created_at as string,
    }))
  } catch (error) {
    console.error('[IpAllowlist] Failed to get IP allowlist:', error)
    return []
  }
}

/**
 * Check if an IP address is allowed for an instance.
 */
export async function isIpAllowed(instanceId: string, ipAddress: string): Promise<boolean> {
  try {
    // First check if allowlist is enabled for this instance
    const allowlist = await getIpAllowlist(instanceId)

    // If no allowlist entries, allow all IPs
    if (allowlist.length === 0) {
      return true
    }

    // Check for exact match
    const exactMatch = allowlist.find(
      entry => entry.enabled && entry.ipAddress === ipAddress
    )

    if (exactMatch) {
      return true
    }

    // Check CIDR ranges
    for (const entry of allowlist) {
      if (!entry.enabled || !entry.cidr) continue

      if (isIpInCidr(ipAddress, entry.cidr)) {
        return true
      }
    }

    return false
  } catch (error) {
    console.error('[IpAllowlist] Failed to check IP allowlist:', error)
    // On error, default to allowing (fail open) to prevent lockouts
    return true
  }
}

/**
 * Check if IP is in CIDR range (simplified implementation).
 * For production, use a library like 'ip-cidr' or 'ipaddr.js'.
 */
function isIpInCidr(ip: string, cidr: string): boolean {
  // This is a simplified implementation
  // For production, use a proper CIDR library

  const [range, bits] = cidr.split('/')
  if (!bits) return ip === range

  const ipParts = ip.split('.').map(Number)
  const rangeParts = range.split('.').map(Number)
  const bitsNum = parseInt(bits, 10)

  // Convert to binary and compare
  let ipBinary = ''
  let rangeBinary = ''

  for (let i = 0; i < 4; i++) {
    ipBinary += ipParts[i].toString(2).padStart(8, '0')
    rangeBinary += rangeParts[i].toString(2).padStart(8, '0')
  }

  // Compare first 'bits' characters
  return ipBinary.substring(0, bitsNum) === rangeBinary.substring(0, bitsNum)
}

/**
 * Toggle IP allowlist entry.
 */
export async function toggleIpAllowlistEntry(id: string, instanceId: string, enabled: boolean): Promise<void> {
  await db.execute({
    sql: 'UPDATE ip_allowlist SET enabled = ? WHERE id = ? AND instance_id = ?',
    args: [enabled ? 1 : 0, id, instanceId],
  })
}
