import pino from 'pino'

/**
 * Structured logger for PicoBase platform.
 *
 * - JSON output in production (machine-readable, ideal for log aggregation)
 * - Pretty-printed output in development (human-readable)
 * - Consistent context fields: instanceId, userId, action, duration
 *
 * Usage:
 *   import { logger } from '@/lib/logger'
 *   logger.info({ instanceId, action: 'backup.create' }, 'Backup started')
 *   logger.error({ instanceId, err }, 'Backup failed')
 */

const isDev = process.env.NODE_ENV !== 'production'

export const logger = pino({
  level: process.env.LOG_LEVEL || (isDev ? 'debug' : 'info'),
  ...(isDev
    ? {
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'SYS:HH:MM:ss.l',
            ignore: 'pid,hostname',
          },
        },
      }
    : {
        // Production: JSON to stdout, no formatting overhead
        formatters: {
          level(label) {
            return { level: label }
          },
        },
        timestamp: pino.stdTimeFunctions.isoTime,
      }),
})

/**
 * Create a child logger scoped to a specific module.
 * Adds `module` field to every log line from this logger.
 *
 * Usage:
 *   const log = createModuleLogger('Scheduler')
 *   log.info({ instanceId }, 'Health check passed')
 */
export function createModuleLogger(module: string) {
  return logger.child({ module })
}

/**
 * Create a child logger scoped to a specific request.
 * Adds `requestId`, `method`, and `path` fields.
 */
export function createRequestLogger(opts: {
  requestId: string
  method: string
  path: string
  instanceId?: string
  userId?: string
}) {
  return logger.child(opts)
}
