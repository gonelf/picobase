import { db } from './db'
import { nanoid } from 'nanoid'

/**
 * Non-blocking usage logger for API requests.
 *
 * Writes to the usage_logs table for billing and analytics. Failures are
 * silently swallowed — usage logging should never break a request.
 */

interface LogEntry {
  instanceId: string
  apiKeyId?: string
  method: string
  path: string
  status: number
  durationMs: number
}

// Buffer log entries and flush in batches for efficiency
const buffer: LogEntry[] = []
const FLUSH_INTERVAL = 10_000 // 10 seconds
const MAX_BUFFER_SIZE = 50

let flushTimer: ReturnType<typeof setInterval> | null = null

function startFlushTimer() {
  if (flushTimer) return
  flushTimer = setInterval(() => {
    flushBuffer().catch(() => {})
  }, FLUSH_INTERVAL)
}

async function flushBuffer(): Promise<void> {
  if (buffer.length === 0) return

  const entries = buffer.splice(0, buffer.length)
  const now = new Date().toISOString()

  try {
    // Batch insert — Turso supports this via multiple execute calls
    // For simplicity, insert one at a time (Turso is fast for small writes)
    for (const entry of entries) {
      await db.execute({
        sql: 'INSERT INTO usage_logs (id, instance_id, event_type, metadata, created_at) VALUES (?, ?, ?, ?, ?)',
        args: [
          nanoid(),
          entry.instanceId,
          'api_request',
          JSON.stringify({
            api_key_id: entry.apiKeyId ?? null,
            method: entry.method,
            path: entry.path,
            status: entry.status,
            duration_ms: entry.durationMs,
          }),
          now,
        ],
      })
    }
  } catch (error) {
    // Non-critical — don't let logging failures affect requests
    console.error('[UsageLog] Failed to flush buffer:', error)
  }
}

/**
 * Log an API request. Non-blocking — returns immediately.
 */
export function logApiRequest(entry: LogEntry): void {
  buffer.push(entry)
  startFlushTimer()

  if (buffer.length >= MAX_BUFFER_SIZE) {
    flushBuffer().catch(() => {})
  }
}
