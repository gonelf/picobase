import { NextRequest, NextResponse } from 'next/server'
import { runScheduledTasks } from '@/lib/scheduler'

/**
 * Cron job endpoint for scheduled tasks.
 *
 * Configure this with Vercel Cron or external cron service.
 * Example vercel.json:
 * {
 *   "crons": [
 *     {
 *       "path": "/api/cron?task=health",
 *       "schedule": "*/5 * * * *"
 *     },
 *     {
 *       "path": "/api/cron?task=backup",
 *       "schedule": "0 * * * *"
 *     },
 *     {
 *       "path": "/api/cron?task=cleanup",
 *       "schedule": "0 0 * * *"
 *     }
 *   ]
 * }
 */

export async function GET(request: NextRequest) {
  try {
    // Verify authorization (check for cron secret)
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get task type from query
    const searchParams = request.nextUrl.searchParams
    const task = searchParams.get('task') || 'all'

    if (!['health', 'backup', 'cleanup', 'all'].includes(task)) {
      return NextResponse.json(
        { error: 'Invalid task type. Must be: health, backup, cleanup, or all' },
        { status: 400 }
      )
    }

    // Run the scheduled task
    await runScheduledTasks(task as 'health' | 'backup' | 'cleanup' | 'all')

    return NextResponse.json({
      success: true,
      task,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('[Cron] Task execution failed:', error)
    return NextResponse.json(
      {
        error: 'Task execution failed',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}

// Allow POST as well for manual triggering
export async function POST(request: NextRequest) {
  return GET(request)
}
