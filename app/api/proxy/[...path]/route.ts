import { NextRequest, NextResponse } from 'next/server'
import { getInstanceBySubdomain } from '@/lib/db'
import { startRailwayInstance } from '@/lib/railway-client'
import { ensureInstancePort } from '@/lib/instance-management'
import { touchInstanceActivity } from '@/lib/activity'
import { validateApiKey } from '@/lib/api-keys'
import { checkRateLimit } from '@/lib/rate-limit'
import { logApiRequest } from '@/lib/usage-log'

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

// CORS headers for SDK clients
function corsHeaders(request: NextRequest): Record<string, string> {
    const origin = request.headers.get('origin') || '*'
    return {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-PicoBase-Key',
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Max-Age': '86400',
    }
}

// Standardized error response format for SDK consumers
function errorResponse(
    request: NextRequest,
    code: string,
    message: string,
    status: number,
    extraHeaders?: Record<string, string>,
) {
    return NextResponse.json(
        { error: { code, message } },
        { status, headers: { ...corsHeaders(request), ...extraHeaders } },
    )
}

export async function OPTIONS(request: NextRequest) {
    return new NextResponse(null, { status: 204, headers: corsHeaders(request) })
}

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
    const startTime = Date.now()
    let apiKeyId: string | undefined

    try {
        // Get subdomain from middleware header
        const subdomain = request.headers.get('x-instance-subdomain')

        if (!subdomain) {
            return errorResponse(request, 'BAD_REQUEST', 'Invalid instance subdomain', 400)
        }

        // Lookup instance by subdomain
        const instance = await getInstanceBySubdomain(subdomain)

        if (!instance) {
            return errorResponse(request, 'NOT_FOUND', 'Instance not found', 404)
        }

        // Validate API key if provided (SDK clients send X-PicoBase-Key)
        const picobaseKey = request.headers.get('x-picobase-key')
        if (picobaseKey) {
            const keyResult = await validateApiKey(picobaseKey)
            if (!keyResult) {
                return errorResponse(request, 'INVALID_API_KEY', 'Invalid or expired API key', 401)
            }
            // Ensure the API key belongs to this instance
            if (keyResult.instanceId !== instance.id) {
                return errorResponse(request, 'INVALID_API_KEY', 'API key does not match instance', 401)
            }
            apiKeyId = keyResult.apiKeyId

            // Rate limit per API key (100 requests/minute)
            const rateResult = checkRateLimit(`key:${apiKeyId}`, 100, 60_000)
            if (!rateResult.allowed) {
                return errorResponse(
                    request,
                    'RATE_LIMITED',
                    'Too many requests. Please slow down.',
                    429,
                    {
                        'Retry-After': String(Math.ceil(rateResult.resetMs / 1000)),
                        'X-RateLimit-Limit': String(rateResult.limit),
                        'X-RateLimit-Remaining': '0',
                        'X-RateLimit-Reset': String(Math.ceil(rateResult.resetMs / 1000)),
                    },
                )
            }
        }

        // Check if instance is running
        if (instance.status !== 'running') {
            return errorResponse(
                request,
                'INSTANCE_UNAVAILABLE',
                `Instance is not running (status: ${instance.status})`,
                503,
            )
        }

        // Extract the path that should be forwarded to PocketBase
        // The middleware rewrote /some/path to /api/proxy/some/path
        // So we need to extract everything after /api/proxy
        const url = new URL(request.url)
        const pathToProxy = url.pathname.replace('/api/proxy', '') || '/'
        const search = url.search

        // Health check endpoint — responds without hitting the PocketBase instance
        if (pathToProxy === '/api/picobase/health') {
            return NextResponse.json(
                {
                    status: 'ok',
                    instance: {
                        id: instance.id,
                        name: instance.name,
                        subdomain: instance.subdomain,
                        status: instance.status,
                    },
                },
                { headers: corsHeaders(request) },
            )
        }

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

                // Forward important request headers
                const headersToForward: Record<string, string> = {
                    'X-API-Key': RAILWAY_API_KEY!,
                }

                // Forward these headers if they exist
                const headerNames = [
                    'content-type',
                    'authorization',
                    'cookie',
                    'accept',
                    'accept-encoding',
                    'accept-language',
                    'user-agent',
                    'referer',
                    'origin',
                ]

                for (const headerName of headerNames) {
                    const value = request.headers.get(headerName)
                    if (value) {
                        headersToForward[headerName] = value
                    }
                }

                proxyResponse = await fetch(railwayProxyUrl, {
                    method: request.method,
                    headers: headersToForward,
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

        // Forward important response headers from PocketBase
        const responseHeaders = new Headers()

        const responseHeaderNames = [
            'content-type',
            'cache-control',
            'content-encoding',
            'content-security-policy',
            'x-content-type-options',
            'x-frame-options',
            'etag',
            'last-modified',
            'expires',
            'vary',
        ]

        for (const headerName of responseHeaderNames) {
            const value = proxyResponse.headers.get(headerName)
            if (value) {
                responseHeaders.set(headerName, value)
            }
        }

        // Handle set-cookie separately as it can have multiple values
        const setCookieHeader = proxyResponse.headers.get('set-cookie')
        if (setCookieHeader) {
            responseHeaders.set('set-cookie', setCookieHeader)
        }

        // Add CORS headers for SDK clients
        const cors = corsHeaders(request)
        for (const [key, value] of Object.entries(cors)) {
            responseHeaders.set(key, value)
        }

        // Record activity (non-blocking, debounced)
        touchInstanceActivity(instance.id).catch(() => {})

        // Log usage (non-blocking)
        logApiRequest({
            instanceId: instance.id,
            apiKeyId,
            method: request.method,
            path: pathToProxy,
            status: proxyResponse.status,
            durationMs: Date.now() - startTime,
        })

        // Return the proxied response
        return new NextResponse(responseBody, {
            status: proxyResponse.status,
            statusText: proxyResponse.statusText,
            headers: responseHeaders,
        })
    } catch (error) {
        console.error('Proxy error:', error)
        return errorResponse(
            request,
            'PROXY_ERROR',
            error instanceof Error ? error.message : 'Proxy request failed',
            500,
        )
    }
}
