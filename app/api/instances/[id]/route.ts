import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { deleteInstance } from '@/lib/pocketbase'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await deleteInstance(params.id, session.user.id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete instance error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
