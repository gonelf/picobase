import { nanoid } from 'nanoid'
import bcrypt from 'bcryptjs'
import { db } from './db'

export async function generateApiKey(): Promise<{ key: string; prefix: string }> {
  const prefix = `pbk_${nanoid(8)}`
  const secret = nanoid(32)
  const key = `${prefix}_${secret}`

  return { key, prefix }
}

export async function hashApiKey(key: string): Promise<string> {
  return bcrypt.hash(key, 10)
}

export async function verifyApiKey(key: string, hash: string): Promise<boolean> {
  return bcrypt.compare(key, hash)
}

export async function createApiKey(instanceId: string, name: string, expiresAt?: string) {
  const id = nanoid()
  const { key, prefix } = await generateApiKey()
  const keyHash = await hashApiKey(key)
  const now = new Date().toISOString()

  await db.execute({
    sql: 'INSERT INTO api_keys (id, instance_id, key_hash, key_prefix, name, created_at, expires_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
    args: [id, instanceId, keyHash, prefix, name, now, expiresAt || null],
  })

  return {
    id,
    key,
    prefix,
    name,
    created_at: now,
  }
}

export async function validateApiKey(key: string): Promise<{ instanceId: string; apiKeyId: string } | null> {
  const prefix = key.split('_').slice(0, 2).join('_')

  const result = await db.execute({
    sql: 'SELECT id, instance_id, key_hash, expires_at FROM api_keys WHERE key_prefix = ?',
    args: [prefix],
  })

  if (result.rows.length === 0) {
    return null
  }

  const apiKey = result.rows[0]

  if (apiKey.expires_at && new Date(apiKey.expires_at as string) < new Date()) {
    return null
  }

  const isValid = await verifyApiKey(key, apiKey.key_hash as string)

  if (!isValid) {
    return null
  }

  await db.execute({
    sql: 'UPDATE api_keys SET last_used_at = ? WHERE id = ?',
    args: [new Date().toISOString(), apiKey.id],
  })

  return {
    instanceId: apiKey.instance_id as string,
    apiKeyId: apiKey.id as string,
  }
}

export async function listApiKeys(instanceId: string) {
  const result = await db.execute({
    sql: 'SELECT id, key_prefix, name, last_used_at, created_at, expires_at FROM api_keys WHERE instance_id = ? ORDER BY created_at DESC',
    args: [instanceId],
  })
  return result.rows
}

export async function deleteApiKey(id: string, instanceId: string) {
  await db.execute({
    sql: 'DELETE FROM api_keys WHERE id = ? AND instance_id = ?',
    args: [id, instanceId],
  })
}
