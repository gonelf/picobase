import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { createInstance } from '@/lib/pocketbase'
import { z } from 'zod'

const createInstanceSchema = z.object({
  name: z.string().min(1).max(100),
  subdomain: z.string().min(1).max(63).regex(/^[a-z0-9-]+$/),
})

export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, subdomain } = createInstanceSchema.parse(body)

    const instance = await createInstance(session.user.id, name, subdomain)

    return NextResponse.json(instance, { status: 201 })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
    }

    if (error.message === 'Subdomain already taken') {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    console.error('Create instance error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
