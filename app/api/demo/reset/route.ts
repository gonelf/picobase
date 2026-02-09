import { NextRequest, NextResponse } from 'next/server'

const DEMO_INSTANCE_ID = process.env.DEMO_INSTANCE_ID || 'demo'
const RAILWAY_API_URL = process.env.RAILWAY_API_URL
const RAILWAY_API_KEY = process.env.RAILWAY_API_KEY
const DEMO_RESET_SECRET = process.env.DEMO_RESET_SECRET

function normalizeUrl(url: string): string {
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return `https://${url}`
  }
  return url
}

const NORMALIZED_RAILWAY_API_URL = RAILWAY_API_URL ? normalizeUrl(RAILWAY_API_URL) : ''

/**
 * Demo instance reset endpoint
 * Protected by DEMO_RESET_SECRET to prevent unauthorized resets
 * Should be called by cron job daily
 */
export async function POST(request: NextRequest) {
  try {
    // Verify reset secret
    const authHeader = request.headers.get('authorization')
    const providedSecret = authHeader?.replace('Bearer ', '')

    if (!DEMO_RESET_SECRET) {
      return NextResponse.json(
        { error: 'Demo reset not configured' },
        { status: 503 }
      )
    }

    if (providedSecret !== DEMO_RESET_SECRET) {
      console.warn('Unauthorized demo reset attempt')
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    if (!NORMALIZED_RAILWAY_API_URL || !RAILWAY_API_KEY) {
      return NextResponse.json(
        { error: 'Railway API not configured' },
        { status: 503 }
      )
    }

    const startTime = Date.now()

    // Get seed data from request body or use defaults
    const body = await request.json().catch(() => ({}))
    const seedData = body.seedData || getDefaultSeedData()

    console.log(`Starting demo instance reset for ${DEMO_INSTANCE_ID}...`)

    // Step 1: Get all collections
    const collectionsUrl = `${NORMALIZED_RAILWAY_API_URL}/instances/${DEMO_INSTANCE_ID}/proxy/api/collections`
    const collectionsRes = await fetch(collectionsUrl, {
      method: 'GET',
      headers: {
        'X-API-Key': RAILWAY_API_KEY,
        'Content-Type': 'application/json',
      },
    })

    if (!collectionsRes.ok) {
      throw new Error('Failed to fetch collections')
    }

    const collections = await collectionsRes.json()
    const userCollections = collections.filter((c: any) => !c.system)

    // Step 2: Delete all records from each collection
    let deletedCount = 0
    for (const collection of userCollections) {
      try {
        // Fetch all records
        const recordsUrl = `${NORMALIZED_RAILWAY_API_URL}/instances/${DEMO_INSTANCE_ID}/proxy/api/collections/${collection.name}/records?perPage=200`
        const recordsRes = await fetch(recordsUrl, {
          method: 'GET',
          headers: {
            'X-API-Key': RAILWAY_API_KEY,
            'Content-Type': 'application/json',
          },
        })

        if (recordsRes.ok) {
          const recordsData = await recordsRes.json()
          const records = recordsData.items || []

          // Delete each record
          for (const record of records) {
            const deleteUrl = `${NORMALIZED_RAILWAY_API_URL}/instances/${DEMO_INSTANCE_ID}/proxy/api/collections/${collection.name}/records/${record.id}`
            await fetch(deleteUrl, {
              method: 'DELETE',
              headers: {
                'X-API-Key': RAILWAY_API_KEY,
              },
            })
            deletedCount++
          }
        }
      } catch (err) {
        console.error(`Error deleting records from ${collection.name}:`, err)
      }
    }

    console.log(`Deleted ${deletedCount} records from demo instance`)

    // Step 3: Re-seed with fresh data
    let createdCount = 0
    for (const [collectionName, records] of Object.entries(seedData)) {
      if (!Array.isArray(records)) continue

      for (const record of records) {
        try {
          const createUrl = `${NORMALIZED_RAILWAY_API_URL}/instances/${DEMO_INSTANCE_ID}/proxy/api/collections/${collectionName}/records`
          const createRes = await fetch(createUrl, {
            method: 'POST',
            headers: {
              'X-API-Key': RAILWAY_API_KEY,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(record),
          })

          if (createRes.ok) {
            createdCount++
          }
        } catch (err) {
          console.error(`Error creating record in ${collectionName}:`, err)
        }
      }
    }

    const duration = Date.now() - startTime

    console.log(`Demo reset complete: deleted ${deletedCount}, created ${createdCount} records in ${duration}ms`)

    return NextResponse.json({
      success: true,
      stats: {
        deleted: deletedCount,
        created: createdCount,
        duration,
      },
      timestamp: new Date().toISOString(),
    })

  } catch (error) {
    console.error('Demo reset error:', error)
    return NextResponse.json(
      { error: 'Reset failed', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

/**
 * Default seed data for demo instance
 * Customize this based on your collections
 */
function getDefaultSeedData() {
  return {
    posts: [
      {
        title: 'Getting Started with PicoBase',
        content: 'PicoBase is a managed Backend-as-a-Service built on PocketBase. This guide will help you get started.',
        published: true,
        views: 1247,
        tags: ['tutorial', 'getting-started'],
      },
      {
        title: 'Understanding Database Filters',
        content: 'Learn how to use PocketBase filter syntax to query your data effectively.',
        published: true,
        views: 892,
        tags: ['tutorial', 'database'],
      },
      {
        title: 'Building a Real-time Chat App',
        content: 'Step-by-step guide to building a real-time chat application using PicoBase subscriptions.',
        published: true,
        views: 1543,
        tags: ['tutorial', 'realtime'],
      },
      {
        title: 'Authentication Best Practices',
        content: 'Security tips and best practices for implementing authentication in your PicoBase app.',
        published: true,
        views: 678,
        tags: ['security', 'auth'],
      },
      {
        title: 'Draft: New Features Coming Soon',
        content: 'Upcoming features and improvements to PicoBase.',
        published: false,
        views: 23,
        tags: ['announcements'],
      },
      {
        title: 'File Upload Guide',
        content: 'How to handle file uploads and storage with PicoBase.',
        published: true,
        views: 445,
        tags: ['tutorial', 'files'],
      },
      {
        title: 'Optimizing Query Performance',
        content: 'Tips for writing efficient queries and improving response times.',
        published: true,
        views: 334,
        tags: ['performance', 'database'],
      },
      {
        title: 'Working with Relations',
        content: 'Understanding and using relational data in PicoBase.',
        published: true,
        views: 756,
        tags: ['tutorial', 'database'],
      },
      {
        title: 'Deployment Guide',
        content: 'Best practices for deploying your PicoBase application to production.',
        published: true,
        views: 982,
        tags: ['deployment', 'production'],
      },
      {
        title: 'API Reference',
        content: 'Complete API reference for PicoBase SDK methods and options.',
        published: true,
        views: 2104,
        tags: ['reference', 'api'],
      },
    ],
    users: [
      {
        name: 'Demo User',
        email: 'demo@example.com',
        bio: 'This is a demo user account for testing.',
      },
      {
        name: 'Jane Developer',
        email: 'jane@example.com',
        bio: 'Full-stack developer and PicoBase enthusiast.',
      },
      {
        name: 'John Builder',
        email: 'john@example.com',
        bio: 'Building awesome apps with PicoBase.',
      },
      {
        name: 'Alice Coder',
        email: 'alice@example.com',
        bio: 'Learning to build with PicoBase.',
      },
    ],
    comments: [
      {
        content: 'Great tutorial! This really helped me understand the basics.',
        author: 'Demo User',
      },
      {
        content: 'Very clear explanation. Looking forward to more tutorials.',
        author: 'Jane Developer',
      },
      {
        content: 'This is exactly what I was looking for. Thanks!',
        author: 'John Builder',
      },
      {
        content: 'Can you add more examples on real-time subscriptions?',
        author: 'Alice Coder',
      },
      {
        content: 'The filter syntax is so intuitive!',
        author: 'Demo User',
      },
    ],
  }
}
