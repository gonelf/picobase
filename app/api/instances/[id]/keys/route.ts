import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/auth-provider'
import { createApiKey } from '@/lib/api-keys'
import { db } from '@/lib/db'
import { z } from 'zod'
import { createModuleLogger } from '@/lib/logger'

const log = createModuleLogger('API:Instances/Id/Keys')

const createKeySchema = z.object({
  name: z.string().min(1).max(100),
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAuthSession()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const result = await db.execute({
      sql: 'SELECT user_id FROM instances WHERE id = ?',
      args: [id],
    })

    if (result.rows.length === 0 || result.rows[0].user_id !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { name } = createKeySchema.parse(body)

    const apiKey = await createApiKey(id, name)

    return NextResponse.json(apiKey, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
    }

    log.error({ err: error }, 'Create API key error')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
