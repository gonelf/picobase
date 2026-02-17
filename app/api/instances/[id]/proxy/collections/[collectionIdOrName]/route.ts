import { NextRequest, NextResponse } from 'next/server'
import { validateApiKey } from '@/lib/api-keys'
import { db } from '@/lib/db'
import { authenticatedPocketBaseRequest } from '@/lib/pocketbase-auth'

// Helper function to handle shared validation logic
async function validateRequest(req: NextRequest, instanceIdParam: string) {
    const authHeader = req.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
        return { error: 'Missing or invalid authorization header', status: 401 }
    }

    const apiKey = authHeader.split(' ')[1]
    const keyValidation = await validateApiKey(apiKey)

    if (!keyValidation) {
        return { error: 'Invalid API key', status: 401 }
    }

    // Validate instance match
    if (keyValidation.instanceId !== instanceIdParam) {
        return { error: 'API key does not match instance', status: 403 }
    }

    // Validate admin privileges
    if (keyValidation.type !== 'admin') {
        return { error: 'Admin privileges required', status: 403 }
    }

    const instance = await db.execute({
        sql: 'SELECT * FROM instances WHERE id = ?',
        args: [keyValidation.instanceId],
    })

    if (instance.rows.length === 0) {
        return { error: 'Instance not found', status: 404 }
    }

    return { instance: instance.rows[0], keyValidation }
}

export async function GET(
    req: NextRequest,
    { params }: { params: { id: string; collectionIdOrName: string } }
) {
    const validation = await validateRequest(req, params.id)
    if (validation.error) {
        return NextResponse.json({ error: validation.error }, { status: validation.status })
    }

    const { instance } = validation

    try {
        const searchParams = req.nextUrl.searchParams.toString()
        const path = `api/collections/${params.collectionIdOrName}${searchParams ? `?${searchParams}` : ''}`

        const response = await authenticatedPocketBaseRequest(
            validation.keyValidation!.instanceId,
            instance!.admin_email as string,
            instance!.admin_password as string,
            path,
            {
                method: 'GET',
            }
        )

        const data = await response.json()
        return NextResponse.json(data, { status: response.status })
    } catch (error: any) {
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
    }
}

export async function PATCH(
    req: NextRequest,
    { params }: { params: { id: string; collectionIdOrName: string } }
) {
    const validation = await validateRequest(req, params.id)
    if (validation.error) {
        return NextResponse.json({ error: validation.error }, { status: validation.status })
    }

    const { instance } = validation

    try {
        const body = await req.json()

        const response = await authenticatedPocketBaseRequest(
            validation.keyValidation!.instanceId,
            instance!.admin_email as string,
            instance!.admin_password as string,
            `api/collections/${params.collectionIdOrName}`,
            {
                method: 'PATCH',
                body: JSON.stringify(body),
            }
        )

        const data = await response.json()
        return NextResponse.json(data, { status: response.status })
    } catch (error: any) {
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
    }
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: { id: string; collectionIdOrName: string } }
) {
    const validation = await validateRequest(req, params.id)
    if (validation.error) {
        return NextResponse.json({ error: validation.error }, { status: validation.status })
    }

    const { instance } = validation

    try {
        const response = await authenticatedPocketBaseRequest(
            validation.keyValidation!.instanceId,
            instance!.admin_email as string,
            instance!.admin_password as string,
            `api/collections/${params.collectionIdOrName}`,
            {
                method: 'DELETE',
            }
        )

        // DELETE returns 204 No Content typically, or potentially a JSON with success status
        if (response.status === 204) {
            return new NextResponse(null, { status: 204 })
        }

        const data = await response.json()
        return NextResponse.json(data, { status: response.status })
    } catch (error: any) {
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
    }
}
