import { NextRequest, NextResponse } from 'next/server'
import { validateDemoAccess } from '@/lib/demo-security'

// Demo instance configuration
// This should point to a dedicated demo instance with sample data
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

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json()
    const { method, collection, params } = body

    if (!method || !collection) {
      return NextResponse.json(
        { error: 'Method and collection are required' },
        { status: 400 }
      )
    }

    // Validate demo access with security checks
    const securityCheck = validateDemoAccess(request, method)
    if (!securityCheck.allowed) {
      return NextResponse.json(
        { error: securityCheck.error },
        { status: 403 }
      )
    }

    if (!NORMALIZED_RAILWAY_API_URL || !RAILWAY_API_KEY) {
      return NextResponse.json(
        { error: 'Demo service not configured' },
        { status: 503 }
      )
    }

    // Build the appropriate API call based on method
    let railwayUrl = ''
    let httpMethod = 'GET'

    switch (method) {
      case 'getList': {
        const searchParams = new URLSearchParams()
        if (params?.page) searchParams.append('page', params.page)
        if (params?.perPage) searchParams.append('perPage', params.perPage)
        if (params?.filter) searchParams.append('filter', params.filter)
        if (params?.sort) searchParams.append('sort', params.sort)
        if (params?.expand) searchParams.append('expand', params.expand)

        railwayUrl = `${NORMALIZED_RAILWAY_API_URL}/instances/${DEMO_INSTANCE_ID}/proxy/api/collections/${collection}/records?${searchParams.toString()}`
        httpMethod = 'GET'
        break
      }

      case 'getOne': {
        if (!params?.recordId) {
          return NextResponse.json(
            { error: 'Record ID is required for getOne' },
            { status: 400 }
          )
        }

        const searchParams = new URLSearchParams()
        if (params?.expand) searchParams.append('expand', params.expand)

        railwayUrl = `${NORMALIZED_RAILWAY_API_URL}/instances/${DEMO_INSTANCE_ID}/proxy/api/collections/${collection}/records/${params.recordId}${searchParams.toString() ? '?' + searchParams.toString() : ''}`
        httpMethod = 'GET'
        break
      }

      default:
        return NextResponse.json(
          { error: 'Unsupported method. Only getList and getOne are allowed in demo mode.' },
          { status: 403 }
        )
    }

    // Make the request to the demo instance
    const startTime = Date.now()
    const response = await fetch(railwayUrl, {
      method: httpMethod,
      headers: {
        'X-API-Key': RAILWAY_API_KEY,
        'Content-Type': 'application/json',
      },
    })

    const endTime = Date.now()
    const duration = endTime - startTime

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Demo API request failed: ${response.status} ${errorText}`)
      return NextResponse.json(
        { error: 'Request failed', details: errorText },
        { status: response.status }
      )
    }

    const data = await response.json()

    return NextResponse.json({
      data,
      timing: duration,
      demo: true,
      message: 'This is demo data. Sign up to use PicoBase with your own data.',
    })

  } catch (error) {
    console.error('Demo playground error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
