import { NextRequest, NextResponse } from 'next/server'
import { validateApiKey } from '@/lib/api-keys'
import { db, getInstanceBySubdomain } from '@/lib/db'
import { authenticatedPocketBaseRequest } from '@/lib/pocketbase-auth'

// List collections or Create collection
export async function GET(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    const authHeader = req.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
        return NextResponse.json({ error: 'Missing or invalid authorization header' }, { status: 401 })
    }

    const apiKey = authHeader.split(' ')[1]
    const keyValidation = await validateApiKey(apiKey)

    if (!keyValidation) {
        return NextResponse.json({ error: 'Invalid API key' }, { status: 401 })
    }

    // Check if key belongs to this instance (params.id matches instanceId)
    // Note: keyValidation.instanceId is the ID from database, params.id might be subdomain or ID
    // Let's first resolve the instance from params

    // Implementation note: The SDK sends requests to https://[subdomain].picobase.app/api/...
    // The middleware rewrites this to /api/instances/[id]/proxy/...
    // However, the `validateApiKey` already returns the correct instanceId for the key.
    // We should verify they match if possible, or just rely on the key's instanceId.
    // Since the middleware does the routing based on subdomain, params.id should be the instance ID.

    if (keyValidation.instanceId !== params.id) {
        return NextResponse.json({ error: 'API key does not match instance' }, { status: 403 })
    }

    if (keyValidation.type !== 'admin') {
        return NextResponse.json({ error: 'Admin privileges required' }, { status: 403 })
    }

    const instance = await db.execute({
        sql: 'SELECT * FROM instances WHERE id = ?',
        args: [keyValidation.instanceId],
    })

    if (instance.rows.length === 0) {
        return NextResponse.json({ error: 'Instance not found' }, { status: 404 })
    }

    const instanceData = instance.rows[0]

    try {
        const searchParams = req.nextUrl.searchParams.toString()
        const path = `api/collections${searchParams ? `?${searchParams}` : ''}`

        const response = await authenticatedPocketBaseRequest(
            keyValidation.instanceId,
            instanceData.admin_email as string,
            instanceData.admin_password as string,
            path,
            {
                method: 'GET',
            }
        )

        const data = await response.json()
        return NextResponse.json(data, { status: response.status })
    } catch (error: any) {
        console.error('Failed to proxy request:', error)
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
    }
}

export async function POST(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    const authHeader = req.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
        return NextResponse.json({ error: 'Missing or invalid authorization header' }, { status: 401 })
    }

    const apiKey = authHeader.split(' ')[1]
    const keyValidation = await validateApiKey(apiKey)

    if (!keyValidation) {
        return NextResponse.json({ error: 'Invalid API key' }, { status: 401 })
    }

    if (keyValidation.instanceId !== params.id) {
        return NextResponse.json({ error: 'API key does not match instance' }, { status: 403 })
    }

    if (keyValidation.type !== 'admin') {
        return NextResponse.json({ error: 'Admin privileges required' }, { status: 403 })
    }

    const instance = await db.execute({
        sql: 'SELECT * FROM instances WHERE id = ?',
        args: [keyValidation.instanceId],
    })

    if (instance.rows.length === 0) {
        return NextResponse.json({ error: 'Instance not found' }, { status: 404 })
    }

    const instanceData = instance.rows[0]

    try {
        const body = await req.json()

        const response = await authenticatedPocketBaseRequest(
            keyValidation.instanceId,
            instanceData.admin_email as string,
            instanceData.admin_password as string,
            'api/collections',
            {
                method: 'POST',
                body: JSON.stringify(body),
            }
        )

        const data = await response.json()
        return NextResponse.json(data, { status: response.status })
    } catch (error: any) {
        console.error('Failed to proxy request:', error)
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
    }
}
