import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/auth-provider'
import { deleteApiKey } from '@/lib/api-keys'
import { db } from '@/lib/db'
import { createModuleLogger } from '@/lib/logger'

const log = createModuleLogger('API:Instances/Id/Keys/KeyId')

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; keyId: string }> }
) {
  try {
    const session = await getAuthSession()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id, keyId } = await params

    const result = await db.execute({
      sql: 'SELECT user_id FROM instances WHERE id = ?',
      args: [id],
    })

    if (result.rows.length === 0 || result.rows[0].user_id !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await deleteApiKey(keyId, id)

    return NextResponse.json({ success: true })
  } catch (error) {
    log.error({ err: error }, 'Delete API key error')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
