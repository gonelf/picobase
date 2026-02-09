import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { joinWaitlist, getWaitlistEntryByReferralCode, getTotalWaitlistCount } from '@/lib/waitlist'
import { createModuleLogger } from '@/lib/logger'

const log = createModuleLogger('API:Waitlist')

const joinSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  referralCode: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = joinSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      )
    }

    const { email, referralCode } = parsed.data
    const entry = await joinWaitlist(email, referralCode)
    const totalCount = await getTotalWaitlistCount()

    return NextResponse.json({
      position: entry.position,
      referralCode: entry.referral_code,
      referralCount: entry.referral_count,
      totalCount,
    })
  } catch (error) {
    log.error({ err: error }, 'Waitlist join error')
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')

    if (!code) {
      return NextResponse.json({ error: 'Missing referral code' }, { status: 400 })
    }

    const entry = await getWaitlistEntryByReferralCode(code)
    if (!entry) {
      return NextResponse.json({ error: 'Invalid referral code' }, { status: 404 })
    }

    const totalCount = await getTotalWaitlistCount()

    return NextResponse.json({
      position: entry.position,
      referralCode: entry.referral_code,
      referralCount: entry.referral_count,
      totalCount,
    })
  } catch (error) {
    log.error({ err: error }, 'Waitlist status error')
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}
