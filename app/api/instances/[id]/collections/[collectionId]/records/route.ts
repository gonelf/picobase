import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'

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
      console.error(`Failed to fetch records: ${response.status} ${errorText}`)
      return NextResponse.json(
        { error: 'Failed to fetch records', details: errorText },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)

  } catch (error) {
    console.error('Error fetching records:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
