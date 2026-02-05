import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { deleteInstance } from '@/lib/pocketbase'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()

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
