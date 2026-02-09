import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit, checkReferrer } from '@/lib/demo-security'
import { createModuleLogger } from '@/lib/logger'

const log = createModuleLogger('API:Demo/Collections')

const DEMO_INSTANCE_ID = process.env.DEMO_INSTANCE_ID || 'demo'
const RAILWAY_API_URL = process.env.RAILWAY_API_URL
const RAILWAY_API_KEY = process.env.RAILWAY_API_KEY

function normalizeUrl(url: string): string {
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return `https://${url}`
  }
  return url
}

const NORMALIZED_RAILWAY_API_URL = RAILWAY_API_URL ? normalizeUrl(RAILWAY_API_URL) : ''

export async function GET(request: NextRequest) {
  try {
    // Check rate limit
    const rateLimitCheck = checkRateLimit(request)
    if (!rateLimitCheck.allowed) {
      return NextResponse.json(
        { error: rateLimitCheck.error },
        { status: 429 }
      )
    }

    // Check referrer
    const referrerCheck = checkReferrer(request)
    if (!referrerCheck.allowed) {
      return NextResponse.json(
        { error: referrerCheck.error },
        { status: 403 }
      )
    }

    if (!NORMALIZED_RAILWAY_API_URL || !RAILWAY_API_KEY) {
      return NextResponse.json(
        { error: 'Demo service not configured' },
        { status: 503 }
      )
    }

    // Fetch collections from demo instance
    const railwayUrl = `${NORMALIZED_RAILWAY_API_URL}/instances/${DEMO_INSTANCE_ID}/proxy/api/collections`

    const response = await fetch(railwayUrl, {
      method: 'GET',
      headers: {
        'X-API-Key': RAILWAY_API_KEY,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      log.error({ response_status: response.status, errorText: errorText }, 'Failed to fetch demo collections:')
      return NextResponse.json(
        { error: 'Failed to fetch collections' },
        { status: response.status }
      )
    }

    const collections = await response.json()

    // Filter out system collections and only return safe ones for demo
    const safeCollections = collections.filter((c: any) => !c.system)

    return NextResponse.json(safeCollections)

  } catch (error) {
    log.error({ err: error }, 'Error fetching demo collections')
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
