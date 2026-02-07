import { spawn, ChildProcess } from 'child_process'
import { db } from './db'
import { downloadDatabase, uploadDatabase, databaseExists } from './r2'
import { nanoid } from 'nanoid'
import path from 'path'
import fs from 'fs/promises'
import { existsSync } from 'fs'

const POCKETBASE_BINARY = process.env.POCKETBASE_BINARY_PATH || 'pocketbase'
const INSTANCES_DIR = path.join(process.cwd(), 'instances')
const BASE_PORT = parseInt(process.env.INSTANCES_BASE_PORT || '8090')

const runningInstances = new Map<string, { process: ChildProcess; port: number }>()

async function ensureInstancesDir() {
  if (!existsSync(INSTANCES_DIR)) {
    await fs.mkdir(INSTANCES_DIR, { recursive: true })
  }
}

function getAvailablePort(): number {
  const usedPorts = new Set(
    Array.from(runningInstances.values()).map((i) => i.port)
  )

  for (let port = BASE_PORT; port < BASE_PORT + 1000; port++) {
    if (!usedPorts.has(port)) {
      return port
    }
  }

  throw new Error('No available ports')
}

export async function createInstance(
  userId: string,
  name: string,
  subdomain: string,
  adminEmail: string,
  adminPassword: string
) {
  const id = nanoid()
  const now = new Date().toISOString()
  const r2Key = `instances/${id}/pb_data.db`

  const existingSubdomain = await db.execute({
    sql: 'SELECT id FROM instances WHERE subdomain = ?',
    args: [subdomain],
  })

  if (existingSubdomain.rows.length > 0) {
    throw new Error('Subdomain already taken')
  }

  await db.execute({
    sql: 'INSERT INTO instances (id, user_id, name, subdomain, status, r2_key, admin_email, admin_password, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    args: [id, userId, name, subdomain, 'stopped', r2Key, adminEmail, adminPassword, now, now],
  })

  // Only create filesystem directories in local development
  // On serverless (Vercel), instances run on Railway, not locally
  // Check if we're in a serverless environment by looking for VERCEL or LAMBDA env vars
  const isServerless = process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME

  if (!isServerless) {
    try {
      const instanceDir = path.join(INSTANCES_DIR, id)
      await fs.mkdir(instanceDir, { recursive: true })

      const pbDataDir = path.join(instanceDir, 'pb_data')
      await fs.mkdir(pbDataDir, { recursive: true })
    } catch (error) {
      // Ignore filesystem errors in serverless environments
      console.log('Skipping local directory creation (serverless environment or read-only filesystem)')
    }
  }

  return {
    id,
    name,
    subdomain,
    status: 'stopped',
    created_at: now,
  }
}

async function createPocketBaseAdmin(port: number, email: string, password: string): Promise<void> {
  try {
    // Create initial admin user via PocketBase API
    const response = await fetch(`http://127.0.0.1:${port}/api/admins`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
        passwordConfirm: password,
      }),
    })

    if (response.ok) {
      console.log(`Successfully created admin user: ${email}`)
    } else if (response.status === 400) {
      // Admin already exists, which is fine
      console.log(`Admin user already exists for port ${port}`)
    } else {
      const errorText = await response.text()
      console.error(`Failed to create admin user: ${response.status} ${errorText}`)
    }
  } catch (error) {
    console.error('Error creating PocketBase admin:', error)
    // Don't throw - this is not critical, admin can be created manually if needed
  }
}

export async function startInstance(instanceId: string): Promise<{ port: number; url: string }> {
  await ensureInstancesDir()

  if (runningInstances.has(instanceId)) {
    const instance = runningInstances.get(instanceId)!
    return {
      port: instance.port,
      url: `http://localhost:${instance.port}`,
    }
  }

  const result = await db.execute({
    sql: 'SELECT * FROM instances WHERE id = ?',
    args: [instanceId],
  })

  if (result.rows.length === 0) {
    throw new Error('Instance not found')
  }

  const instance = result.rows[0] as any

  await db.execute({
    sql: 'UPDATE instances SET status = ? WHERE id = ?',
    args: ['starting', instanceId],
  })

  const instanceDir = path.join(INSTANCES_DIR, instanceId)
  const dbPath = path.join(instanceDir, 'pb_data', 'data.db')
  const isFirstRun = !existsSync(dbPath)

  await fs.mkdir(path.join(instanceDir, 'pb_data'), { recursive: true })

  const dbExistsInR2 = await databaseExists(instanceId)
  if (dbExistsInR2) {
    await downloadDatabase(instanceId, dbPath)
  }

  const port = getAvailablePort()

  const pbProcess = spawn(POCKETBASE_BINARY, ['serve', '--http', `127.0.0.1:${port}`, '--dir', instanceDir], {
    cwd: instanceDir,
    stdio: 'pipe',
  })

  runningInstances.set(instanceId, { process: pbProcess, port })

  pbProcess.on('exit', async (code) => {
    console.log(`Instance ${instanceId} exited with code ${code}`)
    runningInstances.delete(instanceId)

    if (existsSync(dbPath)) {
      await uploadDatabase(instanceId, dbPath)
    }

    await db.execute({
      sql: 'UPDATE instances SET status = ?, port = ?, last_stopped_at = ? WHERE id = ?',
      args: ['stopped', null, new Date().toISOString(), instanceId],
    })
  })

  pbProcess.on('error', async (error) => {
    console.error(`Instance ${instanceId} error:`, error)
    runningInstances.delete(instanceId)

    await db.execute({
      sql: 'UPDATE instances SET status = ? WHERE id = ?',
      args: ['error', instanceId],
    })
  })

  // Wait for PocketBase to start
  await new Promise((resolve) => setTimeout(resolve, 2000))

  // Automatically create admin account if this is first run and credentials are available
  if ((isFirstRun || !dbExistsInR2) && instance.admin_email && instance.admin_password) {
    console.log(`Creating admin account for instance ${instanceId}...`)
    await createPocketBaseAdmin(port, instance.admin_email, instance.admin_password)
  }

  await db.execute({
    sql: 'UPDATE instances SET status = ?, port = ?, last_started_at = ? WHERE id = ?',
    args: ['running', port, new Date().toISOString(), instanceId],
  })

  return {
    port,
    url: `http://localhost:${port}`,
  }
}

export async function stopInstance(instanceId: string): Promise<void> {
  const instance = runningInstances.get(instanceId)

  if (!instance) {
    return
  }

  await db.execute({
    sql: 'UPDATE instances SET status = ? WHERE id = ?',
    args: ['stopping', instanceId],
  })

  const instanceDir = path.join(INSTANCES_DIR, instanceId)
  const dbPath = path.join(instanceDir, 'pb_data', 'data.db')

  instance.process.kill('SIGTERM')

  await new Promise((resolve) => setTimeout(resolve, 2000))

  if (existsSync(dbPath)) {
    await uploadDatabase(instanceId, dbPath)
  }

  runningInstances.delete(instanceId)

  await db.execute({
    sql: 'UPDATE instances SET status = ?, port = ?, last_stopped_at = ? WHERE id = ?',
    args: ['stopped', null, new Date().toISOString(), instanceId],
  })
}

export async function getInstanceStatus(instanceId: string) {
  const result = await db.execute({
    sql: 'SELECT id, name, subdomain, status, port, created_at, last_started_at, last_stopped_at FROM instances WHERE id = ?',
    args: [instanceId],
  })

  if (result.rows.length === 0) {
    return null
  }

  return result.rows[0]
}

export async function listUserInstances(userId: string) {
  const result = await db.execute({
    sql: 'SELECT id, name, subdomain, status, port, created_at, last_started_at FROM instances WHERE user_id = ? ORDER BY created_at DESC',
    args: [userId],
  })

  return result.rows
}

export async function deleteInstance(instanceId: string, userId: string): Promise<void> {
  await stopInstance(instanceId)

  await db.execute({
    sql: 'DELETE FROM api_keys WHERE instance_id = ?',
    args: [instanceId],
  })

  await db.execute({
    sql: 'DELETE FROM instances WHERE id = ? AND user_id = ?',
    args: [instanceId, userId],
  })

  const instanceDir = path.join(INSTANCES_DIR, instanceId)
  if (existsSync(instanceDir)) {
    await fs.rm(instanceDir, { recursive: true })
  }
}
