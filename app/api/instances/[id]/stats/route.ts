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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id: instanceId } = await params

    if (!NORMALIZED_RAILWAY_API_URL || !RAILWAY_API_KEY) {
      return NextResponse.json(
        { error: 'Railway API not configured' },
        { status: 500 }
      )
    }

    // Fetch collections first
    const collectionsUrl = `${NORMALIZED_RAILWAY_API_URL}/instances/${instanceId}/proxy/api/collections`
    const collectionsResponse = await fetch(collectionsUrl, {
      method: 'GET',
      headers: {
        'X-API-Key': RAILWAY_API_KEY,
        'Content-Type': 'application/json',
      },
    })

    if (!collectionsResponse.ok) {
      throw new Error('Failed to fetch collections')
    }

    const collections = await collectionsResponse.json()

    // Count records in each collection
    const stats = {
      totalCollections: collections.length,
      userCollections: collections.filter((c: any) => !c.system).length,
      systemCollections: collections.filter((c: any) => c.system).length,
      totalRecords: 0,
      collectionStats: [] as Array<{ name: string; count: number }>,
    }

    // Fetch record counts for each non-system collection
    const countPromises = collections
      .filter((c: any) => !c.system)
      .slice(0, 10) // Limit to first 10 collections for performance
      .map(async (collection: any) => {
        try {
          const recordsUrl = `${NORMALIZED_RAILWAY_API_URL}/instances/${instanceId}/proxy/api/collections/${collection.id}/records?page=1&perPage=1`
          const response = await fetch(recordsUrl, {
            method: 'GET',
            headers: {
              'X-API-Key': RAILWAY_API_KEY,
              'Content-Type': 'application/json',
            },
          })

          if (response.ok) {
            const data = await response.json()
            return {
              name: collection.name,
              count: data.totalItems || 0,
            }
          }
        } catch (error) {
          console.error(`Error fetching count for ${collection.name}:`, error)
        }
        return null
      })

    const collectionCounts = await Promise.all(countPromises)
    stats.collectionStats = collectionCounts.filter((c): c is { name: string; count: number } => c !== null)
    stats.totalRecords = stats.collectionStats.reduce((sum, c) => sum + c.count, 0)

    return NextResponse.json(stats)

  } catch (error) {
    console.error('Error fetching stats:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
