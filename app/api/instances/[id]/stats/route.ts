import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { getInstanceCredentials } from '@/lib/get-instance-credentials'
import { authenticatedPocketBaseRequest } from '@/lib/pocketbase-auth'
import { db } from '@/lib/db'
import { createModuleLogger } from '@/lib/logger'

const log = createModuleLogger('API:Instances/Id/Stats')

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

    // Check instance status first
    const instanceResult = await db.execute({
      sql: 'SELECT status FROM instances WHERE id = ? AND user_id = ?',
      args: [instanceId, session.user.id],
    })

    if (instanceResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Instance not found' },
        { status: 404 }
      )
    }

    const status = instanceResult.rows[0].status as string

    if (status !== 'running') {
      return NextResponse.json(
        { error: 'Instance not running', details: `Instance is ${status}. Start the instance to view stats.` },
        { status: 503 }
      )
    }

    // Get instance credentials
    const credentials = await getInstanceCredentials(instanceId, session.user.id)

    if (!credentials) {
      return NextResponse.json(
        { error: 'Instance credentials not found' },
        { status: 404 }
      )
    }

    // Fetch collections first
    const collectionsResponse = await authenticatedPocketBaseRequest(
      instanceId,
      credentials.admin_email,
      credentials.admin_password,
      'api/collections'
    )

    if (!collectionsResponse.ok) {
      throw new Error('Failed to fetch collections')
    }

    const collectionsData = await collectionsResponse.json()
    const collections = Array.isArray(collectionsData) ? collectionsData : (collectionsData.items || [])

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
          const response = await authenticatedPocketBaseRequest(
            instanceId,
            credentials.admin_email,
            credentials.admin_password,
            `api/collections/${collection.id}/records?page=1&perPage=1`
          )

          if (response.ok) {
            const data = await response.json()
            return {
              name: collection.name,
              count: data.totalItems || 0,
            }
          }
        } catch (error) {
          log.error({ err: error, collection_name: collection.name }, 'Error fetching count for')
        }
        return null
      })

    const collectionCounts = await Promise.all(countPromises)
    stats.collectionStats = collectionCounts.filter((c): c is { name: string; count: number } => c !== null)
    stats.totalRecords = stats.collectionStats.reduce((sum, c) => sum + c.count, 0)

    return NextResponse.json(stats)

  } catch (error) {
    log.error({ err: error }, 'Error fetching stats')
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
