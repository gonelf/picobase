import { NextRequest, NextResponse } from 'next/server'
import { getInstanceBySubdomain } from '@/lib/db'
import { startRailwayInstance } from '@/lib/railway-client'

const RAILWAY_API_URL = process.env.RAILWAY_API_URL
const RAILWAY_API_KEY = process.env.RAILWAY_API_KEY

if (!RAILWAY_API_URL) {
    throw new Error('RAILWAY_API_URL environment variable is not set')
}

if (!RAILWAY_API_KEY) {
    throw new Error('RAILWAY_API_KEY environment variable is not set')
}

// Normalize URL
function normalizeUrl(url: string): string {
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        return `https://${url}`
    }
    return url
}

const NORMALIZED_RAILWAY_API_URL = normalizeUrl(RAILWAY_API_URL)

export async function GET(request: NextRequest) {
    return handleProxyRequest(request)
}

export async function POST(request: NextRequest) {
    return handleProxyRequest(request)
}

export async function PUT(request: NextRequest) {
    return handleProxyRequest(request)
}

export async function DELETE(request: NextRequest) {
    return handleProxyRequest(request)
}

export async function PATCH(request: NextRequest) {
    return handleProxyRequest(request)
}

async function handleProxyRequest(request: NextRequest) {
    try {
        // Get subdomain from middleware header
        const subdomain = request.headers.get('x-instance-subdomain')

        if (!subdomain) {
            return NextResponse.json(
                { error: 'Invalid instance subdomain' },
                { status: 400 }
            )
        }

        // Lookup instance by subdomain
        const instance = await getInstanceBySubdomain(subdomain)

        if (!instance) {
            return NextResponse.json(
                { error: 'Instance not found' },
                { status: 404 }
            )
        }

        // Check if instance is running
        if (instance.status !== 'running') {
            return NextResponse.json(
                { error: 'Instance is not running', status: instance.status },
                { status: 503 }
            )
        }

        // Extract the path that should be forwarded to PocketBase
        // The middleware rewrote /some/path to /api/proxy/some/path
        // So we need to extract everything after /api/proxy
        const url = new URL(request.url)
        const pathToProxy = url.pathname.replace('/api/proxy', '') || '/'
        const search = url.search

        // Forward request to Railway service, which will proxy to the PocketBase instance
        const railwayProxyUrl = `${NORMALIZED_RAILWAY_API_URL}/instances/${instance.id}/proxy${pathToProxy}${search}`

        // Get request body if present
        let body: string | undefined
        if (request.method !== 'GET' && request.method !== 'HEAD') {
            body = await request.text()
        }

        // Forward the request to Railway
        let proxyResponse = await fetch(railwayProxyUrl, {
            method: request.method,
            headers: {
                'X-API-Key': RAILWAY_API_KEY!,
                'Content-Type': request.headers.get('content-type') || 'application/json',
                // Forward other relevant headers
                ...(request.headers.get('authorization') && {
                    'authorization': request.headers.get('authorization')!,
                }),
            },
            body,
        })

        // Lazy Recovery: Check if the instance is actually not running on Railway
        // This happens if Railway service restarted but DB still says "running"
        if (proxyResponse.status === 404) {
            // Clone response to read body without consuming the original stream if it's not the error we expect
            const clone = proxyResponse.clone()
            try {
                const errorBody = await clone.json()
                if (errorBody.error === 'Instance not running') {
                    console.log(`[Proxy] Instance ${instance.id} not running on Railway (but DB says running). Auto-recovering...`)

                    // Start the instance
                    await startRailwayInstance(instance.id, instance.port || 8090)

                    // Wait for it to start (3s)
                    await new Promise(resolve => setTimeout(resolve, 3000))

                    // Retry the request
                    proxyResponse = await fetch(railwayProxyUrl, {
                        method: request.method,
                        headers: {
                            'X-API-Key': RAILWAY_API_KEY!,
                            'Content-Type': request.headers.get('content-type') || 'application/json',
                            // Forward other relevant headers
                            ...(request.headers.get('authorization') && {
                                'authorization': request.headers.get('authorization')!,
                            }),
                        },
                        body,
                    })
                }
            } catch (e) {
                // Ignore JSON parse errors, just return original response
            }
        }

        // Get response body
        const responseBody = await proxyResponse.arrayBuffer()

        // Return the proxied response
        return new NextResponse(responseBody, {
            status: proxyResponse.status,
            statusText: proxyResponse.statusText,
            headers: {
                'Content-Type': proxyResponse.headers.get('content-type') || 'application/json',
                // Forward other relevant headers from PocketBase
                ...(proxyResponse.headers.get('cache-control') && {
                    'cache-control': proxyResponse.headers.get('cache-control')!,
                }),
            },
        })
    } catch (error) {
        console.error('Proxy error:', error)
        return NextResponse.json(
            {
                error: 'Proxy request failed',
                details: error instanceof Error ? error.message : String(error)
            },
            { status: 500 }
        )
    }
}
