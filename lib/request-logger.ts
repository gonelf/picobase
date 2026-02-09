import { NextRequest, NextResponse } from 'next/server'
import { createModuleLogger, createRequestLogger } from './logger'
import { nanoid } from 'nanoid'

const log = createModuleLogger('RequestLogger')

/**
 * Wraps an API route handler with structured request logging.
 * Logs method, path, status, and duration for every request.
 *
 * Usage in an API route:
 *   import { withRequestLogging } from '@/lib/request-logger'
 *
 *   async function handler(request: NextRequest) { ... }
 *   export const GET = withRequestLogging(handler)
 */
export function withRequestLogging(
  handler: (request: NextRequest, context?: any) => Promise<NextResponse | Response>
) {
  return async (request: NextRequest, context?: any): Promise<NextResponse | Response> => {
    const startTime = Date.now()
    const requestId = nanoid(12)
    const method = request.method
    const url = new URL(request.url)
    const path = url.pathname

    const reqLog = createRequestLogger({ requestId, method, path })

    reqLog.debug('Request started')

    try {
      const response = await handler(request, context)
      const duration = Date.now() - startTime
      const status = response.status

      if (status >= 500) {
        reqLog.error({ status, duration }, 'Request completed with server error')
      } else if (status >= 400) {
        reqLog.warn({ status, duration }, 'Request completed with client error')
      } else {
        reqLog.info({ status, duration }, 'Request completed')
      }

      // Add request ID to response headers for traceability
      if (response instanceof NextResponse) {
        response.headers.set('x-request-id', requestId)
      }

      return response
    } catch (error) {
      const duration = Date.now() - startTime
      reqLog.error({ err: error, duration }, 'Request failed with unhandled error')
      throw error
    }
  }
}
