import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { touchInstanceActivity } from '@/lib/activity'

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
  { params }: { params: Promise<{ id: string; collectionId: string; recordId: string }> }
) {
  try {
    const session = await getSession()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id: instanceId, collectionId, recordId } = await params

    if (!NORMALIZED_RAILWAY_API_URL || !RAILWAY_API_KEY) {
      return NextResponse.json(
        { error: 'Railway API not configured' },
        { status: 500 }
      )
    }

    // Get query parameters for expand, etc.
    const url = new URL(request.url)
    const searchParams = url.searchParams.toString()

    // Call Railway service to proxy to PocketBase record API
    const railwayUrl = `${NORMALIZED_RAILWAY_API_URL}/instances/${instanceId}/proxy/api/collections/${collectionId}/records/${recordId}${searchParams ? `?${searchParams}` : ''}`

    const response = await fetch(railwayUrl, {
      method: 'GET',
      headers: {
        'X-API-Key': RAILWAY_API_KEY,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Failed to fetch record: ${response.status} ${errorText}`)
      return NextResponse.json(
        { error: 'Failed to fetch record', details: errorText },
        { status: response.status }
      )
    }

    const data = await response.json()
    touchInstanceActivity(instanceId).catch(() => {})
    return NextResponse.json(data)

  } catch (error) {
    console.error('Error fetching record:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; collectionId: string; recordId: string }> }
) {
  try {
    const session = await getSession()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id: instanceId, collectionId, recordId } = await params

    if (!NORMALIZED_RAILWAY_API_URL || !RAILWAY_API_KEY) {
      return NextResponse.json(
        { error: 'Railway API not configured' },
        { status: 500 }
      )
    }

    // Get request body
    const body = await request.json()

    // Call Railway service to proxy to PocketBase record update API
    const railwayUrl = `${NORMALIZED_RAILWAY_API_URL}/instances/${instanceId}/proxy/api/collections/${collectionId}/records/${recordId}`

    const response = await fetch(railwayUrl, {
      method: 'PATCH',
      headers: {
        'X-API-Key': RAILWAY_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Failed to update record: ${response.status} ${errorText}`)
      return NextResponse.json(
        { error: 'Failed to update record', details: errorText },
        { status: response.status }
      )
    }

    const data = await response.json()
    touchInstanceActivity(instanceId).catch(() => {})
    return NextResponse.json(data)

  } catch (error) {
    console.error('Error updating record:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; collectionId: string; recordId: string }> }
) {
  try {
    const session = await getSession()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id: instanceId, collectionId, recordId } = await params

    if (!NORMALIZED_RAILWAY_API_URL || !RAILWAY_API_KEY) {
      return NextResponse.json(
        { error: 'Railway API not configured' },
        { status: 500 }
      )
    }

    // Call Railway service to proxy to PocketBase record delete API
    const railwayUrl = `${NORMALIZED_RAILWAY_API_URL}/instances/${instanceId}/proxy/api/collections/${collectionId}/records/${recordId}`

    const response = await fetch(railwayUrl, {
      method: 'DELETE',
      headers: {
        'X-API-Key': RAILWAY_API_KEY,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Failed to delete record: ${response.status} ${errorText}`)
      return NextResponse.json(
        { error: 'Failed to delete record', details: errorText },
        { status: response.status }
      )
    }

    // DELETE returns 204 No Content on success
    touchInstanceActivity(instanceId).catch(() => {})
    if (response.status === 204) {
      return new NextResponse(null, { status: 204 })
    }

    const data = await response.json()
    return NextResponse.json(data)

  } catch (error) {
    console.error('Error deleting record:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
