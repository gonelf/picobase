import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/auth-provider'
import { createInstance } from '@/lib/pocketbase'
import { z } from 'zod'
import { nanoid } from 'nanoid'

const createInstanceSchema = z.object({
  name: z.string().min(1).max(100),
  subdomain: z.string().min(1).max(63).regex(/^[a-z0-9\-]+$/),
  adminEmail: z.string().email().optional(),
  adminPassword: z.string().min(8).optional(),
})

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, subdomain, adminEmail, adminPassword } = createInstanceSchema.parse(body)

    // Generate default admin credentials if not provided
    const finalAdminEmail = adminEmail || `admin@${subdomain}.picobase.local`
    const finalAdminPassword = adminPassword || nanoid(16)

    const instance = await createInstance(
      session.user.id,
      name,
      subdomain,
      finalAdminEmail,
      finalAdminPassword
    )

    return NextResponse.json({
      ...instance,
      adminEmail: finalAdminEmail,
      // Only return password on creation (for user to save)
      adminPassword: adminPassword ? undefined : finalAdminPassword,
    }, { status: 201 })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      console.error('Validation error:', error.errors)
      return NextResponse.json({
        error: 'Invalid input',
        details: error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
      }, { status: 400 })
    }

    if (error.message === 'Subdomain already taken') {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    console.error('Create instance error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
