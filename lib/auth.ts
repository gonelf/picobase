import bcrypt from 'bcryptjs'
import { db } from './db'

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export async function getUserByEmail(email: string) {
  const result = await db.execute({
    sql: 'SELECT * FROM users WHERE email = ?',
    args: [email],
  })
  return result.rows[0] || null
}

export async function getUserById(id: string) {
  const result = await db.execute({
    sql: 'SELECT * FROM users WHERE id = ?',
    args: [id],
  })
  return result.rows[0] || null
}

export async function createUser(email: string, password: string, name?: string) {
  const { nanoid } = await import('nanoid')
  const id = nanoid()
  const passwordHash = await hashPassword(password)
  const now = new Date().toISOString()

  await db.execute({
    sql: 'INSERT INTO users (id, email, password_hash, name, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
    args: [id, email, passwordHash, name || null, now, now],
  })

  return {
    id,
    email,
    name: name || null,
    created_at: now,
    updated_at: now,
  }
}

export async function syncUser(id: string, email: string, name?: string) {
  // First check if user exists by ID
  const existingUserById = await getUserById(id)
  if (existingUserById) {
    return existingUserById
  }

  // Check if user exists by email (could be from different auth provider)
  const existingUserByEmail = await getUserByEmail(email)
  if (existingUserByEmail) {
    // Update the existing user with the new auth provider ID
    const now = new Date().toISOString()
    await db.execute({
      sql: 'UPDATE users SET id = ?, name = ?, updated_at = ? WHERE email = ?',
      args: [id, name || existingUserByEmail.name, now, email],
    })
    return {
      id,
      email,
      name: name || existingUserByEmail.name || null,
      created_at: existingUserByEmail.created_at,
      updated_at: now,
    }
  }

  // No existing user, create new one
  const now = new Date().toISOString()

  // We use a placeholder hash because auth is handled by auth providers
  // but we need to satisfy the NOT NULL constraint
  const passwordHash = 'managed_by_auth_provider'

  await db.execute({
    sql: 'INSERT INTO users (id, email, password_hash, name, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
    args: [id, email, passwordHash, name || null, now, now],
  })

  return {
    id,
    email,
    name: name || null,
    created_at: now,
    updated_at: now,
  }
}
