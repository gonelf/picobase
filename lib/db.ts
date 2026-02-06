import { createClient } from '@libsql/client'

if (!process.env.TURSO_DATABASE_URL) {
  throw new Error('TURSO_DATABASE_URL is not set')
}

if (!process.env.TURSO_AUTH_TOKEN) {
  throw new Error('TURSO_AUTH_TOKEN is not set')
}

export const db = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
})

// Database Types
export interface User {
  id: string
  email: string
  password_hash: string
  name: string | null
  created_at: string
  updated_at: string
}

export interface Instance {
  id: string
  user_id: string
  name: string
  subdomain: string
  status: 'stopped' | 'starting' | 'running' | 'stopping' | 'error'
  port: number | null
  r2_key: string
  created_at: string
  updated_at: string
  last_started_at: string | null
  last_stopped_at: string | null
}

export interface ApiKey {
  id: string
  instance_id: string
  key_hash: string
  key_prefix: string
  name: string
  last_used_at: string | null
  created_at: string
  expires_at: string | null
}

export interface UsageLog {
  id: string
  instance_id: string
  event_type: string
  metadata: string | null
  created_at: string
}

// Helper function to lookup instance by subdomain
export async function getInstanceBySubdomain(subdomain: string) {
  const result = await db.execute({
    sql: 'SELECT id, user_id, name, subdomain, status, port FROM instances WHERE subdomain = ?',
    args: [subdomain],
  })

  if (result.rows.length === 0) {
    return null
  }

  return result.rows[0] as unknown as Pick<Instance, 'id' | 'user_id' | 'name' | 'subdomain' | 'status' | 'port'>
}
