import { db, WaitlistEntry } from './db'
import { nanoid } from 'nanoid'

function generateReferralCode(): string {
  return nanoid(8)
}

export async function getWaitlistEntryByEmail(email: string): Promise<WaitlistEntry | null> {
  const result = await db.execute({
    sql: 'SELECT * FROM waitlist_entries WHERE email = ?',
    args: [email],
  })
  if (result.rows.length === 0) return null
  return result.rows[0] as unknown as WaitlistEntry
}

export async function getWaitlistEntryByReferralCode(referralCode: string): Promise<WaitlistEntry | null> {
  const result = await db.execute({
    sql: 'SELECT * FROM waitlist_entries WHERE referral_code = ?',
    args: [referralCode],
  })
  if (result.rows.length === 0) return null
  return result.rows[0] as unknown as WaitlistEntry
}

export async function getTotalWaitlistCount(): Promise<number> {
  const result = await db.execute('SELECT COUNT(*) as count FROM waitlist_entries')
  return Number(result.rows[0].count)
}

export async function joinWaitlist(email: string, referrerCode?: string): Promise<WaitlistEntry> {
  const existing = await getWaitlistEntryByEmail(email)
  if (existing) {
    return existing
  }

  const id = nanoid()
  const referralCode = generateReferralCode()
  const now = new Date().toISOString()

  // Get current max position
  const maxResult = await db.execute('SELECT COALESCE(MAX(position), 0) as max_pos FROM waitlist_entries')
  const newPosition = Number(maxResult.rows[0].max_pos) + 1

  // Validate referrer if provided
  let referredBy: string | null = null
  if (referrerCode) {
    const referrer = await getWaitlistEntryByReferralCode(referrerCode)
    if (referrer) {
      referredBy = referrerCode
    }
  }

  // Insert the new entry
  await db.execute({
    sql: `INSERT INTO waitlist_entries (id, email, referral_code, referred_by, position, referral_count, created_at)
          VALUES (?, ?, ?, ?, ?, 0, ?)`,
    args: [id, email, referralCode, referredBy, newPosition, now],
  })

  // If there's a valid referrer, boost their position
  if (referredBy) {
    await boostReferrerPosition(referredBy)
  }

  // Return the newly created entry
  const entry = await getWaitlistEntryByEmail(email)
  return entry!
}

async function boostReferrerPosition(referrerCode: string): Promise<void> {
  const referrer = await getWaitlistEntryByReferralCode(referrerCode)
  if (!referrer || referrer.position <= 1) {
    // Already at the top or not found; just increment count
    if (referrer) {
      await db.execute({
        sql: 'UPDATE waitlist_entries SET referral_count = referral_count + 1 WHERE referral_code = ?',
        args: [referrerCode],
      })
    }
    return
  }

  const newPosition = referrer.position - 1

  // Find the entry currently at the position we want to move into
  const swapResult = await db.execute({
    sql: 'SELECT id FROM waitlist_entries WHERE position = ?',
    args: [newPosition],
  })

  if (swapResult.rows.length > 0) {
    const swapId = swapResult.rows[0].id as string

    // Swap positions: move the other entry down, move referrer up
    await db.execute({
      sql: 'UPDATE waitlist_entries SET position = ? WHERE id = ?',
      args: [referrer.position, swapId],
    })
  }

  // Move referrer up and increment their referral count
  await db.execute({
    sql: 'UPDATE waitlist_entries SET position = ?, referral_count = referral_count + 1 WHERE referral_code = ?',
    args: [newPosition, referrerCode],
  })
}
