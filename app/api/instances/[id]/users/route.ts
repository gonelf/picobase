import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { getInstanceCredentials } from '@/lib/get-instance-credentials'
import { authenticatedPocketBaseRequest } from '@/lib/pocketbase-auth'

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

    // Get instance credentials
    const credentials = await getInstanceCredentials(instanceId, session.user.id)

    if (!credentials) {
      return NextResponse.json(
        { error: 'Instance not found' },
        { status: 404 }
      )
    }

    // Get query parameters for pagination
    const url = new URL(request.url)
    const searchParams = url.searchParams.toString()

    // Make authenticated request to PocketBase users collection
    const response = await authenticatedPocketBaseRequest(
      instanceId,
      credentials.admin_email,
      credentials.admin_password,
      `api/collections/users/records${searchParams ? `?${searchParams}` : ''}`
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Failed to fetch users: ${response.status} ${errorText}`)
      return NextResponse.json(
        { error: 'Failed to fetch users', details: errorText },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)

  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
