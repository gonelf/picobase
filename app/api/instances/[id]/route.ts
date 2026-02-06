import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/auth-provider'
import { deleteInstance } from '@/lib/pocketbase'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAuthSession()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    await deleteInstance(id, session.user.id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete instance error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
