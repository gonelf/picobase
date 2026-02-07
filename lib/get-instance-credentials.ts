import { db } from './db'

export interface InstanceCredentials {
  admin_email: string
  admin_password: string
}

/**
 * Get admin credentials for an instance
 * @param instanceId - The instance ID
 * @param userId - The user ID (for ownership verification)
 * @returns Instance credentials or null if not found
 */
export async function getInstanceCredentials(
  instanceId: string,
  userId: string
): Promise<InstanceCredentials | null> {
  const result = await db.execute({
    sql: 'SELECT admin_email, admin_password FROM instances WHERE id = ? AND user_id = ?',
    args: [instanceId, userId],
  })

  if (result.rows.length === 0) {
    return null
  }

  const row = result.rows[0]
  const admin_email = row.admin_email as string | null
  const admin_password = row.admin_password as string | null

  if (!admin_email || !admin_password) {
    throw new Error('Instance admin credentials not configured')
  }

  return {
    admin_email,
    admin_password,
  }
}
