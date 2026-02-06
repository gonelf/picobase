import { NextRequest, NextResponse } from 'next/server'
import { getInstanceBySubdomain } from '@/lib/db'
import { startRailwayInstance } from '@/lib/railway-client'
import { ensureInstancePort } from '@/lib/instance-management'

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

        // Forward the request to Railway with robust retry and recovery
        let proxyResponse: Response | null = null;
        let lastError: any = null;

        // Try up to 5 times
        for (let attempt = 0; attempt < 5; attempt++) {
            try {
                // If it's a retry, verify/start instance first
                if (attempt > 0) {
                    // Check if we need to start it (only if we suspect it's down)
                    // But simpler strategy: just ensure it's started if we are failing
                    console.log(`[Proxy] Retry attempt ${attempt + 1} for ${instance.id}...`)

                    // Trigger start (idempotent-ish in our new route, but explicit start helps)
                    try {
                        // Ensure we have a valid port (avoid conflicts if old port is stuck)
                        const freshPort = await ensureInstancePort(instance.id, instance.port || 8090)
                        await startRailwayInstance(instance.id, freshPort)
                    } catch (e) {
                        console.warn('[Proxy] Failed to send start command, continuing anyway:', e)
                    }

                    // Wait a bit increasing with attempts: 1s, 2s, 3s, 4s
                    await new Promise(resolve => setTimeout(resolve, attempt * 1000))
                }

                proxyResponse = await fetch(railwayProxyUrl, {
                    method: request.method,
                    headers: {
                        'X-API-Key': RAILWAY_API_KEY!,
                        'Content-Type': request.headers.get('content-type') || 'application/json',
                        ...(request.headers.get('authorization') && {
                            'authorization': request.headers.get('authorization')!,
                        }),
                    },
                    body,
                })

                // Check for "Instance not running" 404 from Railway Service
                if (proxyResponse.status === 404) {
                    const clone = proxyResponse.clone()
                    try {
                        const errorBody = await clone.json()
                        if (errorBody.error === 'Instance not running') {
                            console.log(`[Proxy] Instance ${instance.id} reported not running. Retrying...`)
                            lastError = new Error('Instance not running')
                            continue // Retry loop will trigger start
                        }
                    } catch (e) {
                        // Not JSON, probably real 404
                    }
                }

                // If we get here, we have a valid response (success or application error like 404 from PB itself)
                break

            } catch (error) {
                console.warn(`[Proxy] Fetch error on attempt ${attempt + 1}:`, error)
                lastError = error
                // Continue to next attempt which will try to recover
            }
        }

        if (!proxyResponse) {
            throw lastError || new Error('Failed to connect to instance after retries')
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
