import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { touchInstanceActivity } from '@/lib/activity'
import { createModuleLogger } from '@/lib/logger'

const log = createModuleLogger('API:Instances/Id/Collections/CollectionId/Records')

const RAILWAY_API_URL = process.env.RAILWAY_API_URL
const RAILWAY_API_KEY = process.env.RAILWAY_API_KEY

function normalizeUrl(url: string): string {
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return `https://${url}`
  }
  return url
}

const NORMALIZED_RAILWAY_API_URL = RAILWAY_API_URL ? normalizeUrl(RAILWAY_API_URL) : ''

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; collectionId: string }> }
) {
  try {
    const session = await getSession()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id: instanceId, collectionId } = await params

    if (!NORMALIZED_RAILWAY_API_URL || !RAILWAY_API_KEY) {
      return NextResponse.json(
        { error: 'Railway API not configured' },
        { status: 500 }
      )
    }

    // Get query parameters for pagination, filtering, etc.
    const url = new URL(request.url)
    const searchParams = url.searchParams.toString()

    // Call Railway service to proxy to PocketBase records API
    const railwayUrl = `${NORMALIZED_RAILWAY_API_URL}/instances/${instanceId}/proxy/api/collections/${collectionId}/records${searchParams ? `?${searchParams}` : ''}`

    const response = await fetch(railwayUrl, {
      method: 'GET',
      headers: {
        'X-API-Key': RAILWAY_API_KEY,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      log.error({ response_status: response.status, errorText: errorText }, 'Failed to fetch records:')
      return NextResponse.json(
        { error: 'Failed to fetch records', details: errorText },
        { status: response.status }
      )
    }

    const data = await response.json()
    touchInstanceActivity(instanceId).catch(() => {})
    return NextResponse.json(data)

  } catch (error) {
    log.error({ err: error }, 'Error fetching records')
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; collectionId: string }> }
) {
  try {
    const session = await getSession()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id: instanceId, collectionId } = await params

    if (!NORMALIZED_RAILWAY_API_URL || !RAILWAY_API_KEY) {
      return NextResponse.json(
        { error: 'Railway API not configured' },
        { status: 500 }
      )
    }

    // Get request body
    const body = await request.json()

    // Call Railway service to proxy to PocketBase records API
    const railwayUrl = `${NORMALIZED_RAILWAY_API_URL}/instances/${instanceId}/proxy/api/collections/${collectionId}/records`

    const response = await fetch(railwayUrl, {
      method: 'POST',
      headers: {
        'X-API-Key': RAILWAY_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const errorText = await response.text()
      log.error({ response_status: response.status, errorText: errorText }, 'Failed to create record:')
      return NextResponse.json(
        { error: 'Failed to create record', details: errorText },
        { status: response.status }
      )
    }

    const data = await response.json()
    touchInstanceActivity(instanceId).catch(() => {})
    return NextResponse.json(data)

  } catch (error) {
    log.error({ err: error }, 'Error creating record')
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
