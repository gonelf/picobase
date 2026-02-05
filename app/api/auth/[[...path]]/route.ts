import { backendConfig } from '@/config/backend'
import { NextRequest, NextResponse } from 'next/server'
import SuperTokens from 'supertokens-node'
import { getAppDirRequestHandler } from 'supertokens-node/nextjs'

// Ensure init
SuperTokens.init(backendConfig())

export async function GET(request: NextRequest) {
    const res = await getAppDirRequestHandler()(request)
    return res
}

export async function POST(request: NextRequest) {
    const res = await getAppDirRequestHandler()(request)
    return res
}

export async function DELETE(request: NextRequest) {
    const res = await getAppDirRequestHandler()(request)
    return res
}

export async function PUT(request: NextRequest) {
    const res = await getAppDirRequestHandler()(request)
    return res
}
