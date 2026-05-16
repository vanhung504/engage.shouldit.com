import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { subscribers, events } from '@/db/schema'
import { addAttribute } from '@/lib/attributes'
import { determineSequence } from '@/lib/routing'
import { enrollIfNotEnrolled } from '@/lib/enrollment'
import { createAlertSubscription } from '@/lib/alerts'
import { fetchMemberStatus } from '@/lib/member-status'
import { syncContact } from '@/lib/resend'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

function isValidEmail(email: unknown): boolean {
  return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders })
}

export async function POST(request: Request) {
  let body: {
    email?:      unknown
    attributes?: Record<string, unknown>
    metadata?:   Record<string, unknown>
  }

  try {
    body = await request.json()
  } catch {
    return Response.json(
      { success: false, error: 'Invalid JSON' },
      { status: 400, headers: corsHeaders },
    )
  }

  const { email, attributes: rawAttrs = {} } = body

  // 1. Validate email
  if (!isValidEmail(email)) {
    return Response.json(
      { success: false, error: 'Invalid email' },
      { status: 400, headers: corsHeaders },
    )
  }

  // 2. Check existing subscriber — merge attributes and return early
  const [existing] = await db
    .select()
    .from(subscribers)
    .where(eq(subscribers.email, email as string))
    .limit(1)

  if (existing) {
    for (const [key, value] of Object.entries(rawAttrs)) {
      if (value != null) await addAttribute(existing.id, key, String(value))
    }
    return Response.json({ success: true, isNew: false }, { headers: corsHeaders })
  }

  // 3. Member status check — non-blocking (fetchMemberStatus catches all errors)
  const memberStatus = await fetchMemberStatus(email as string)

  const attrs: Record<string, string> = {}
  for (const [key, value] of Object.entries(rawAttrs)) {
    if (value != null) attrs[key] = String(value)
  }
  if (memberStatus?.tier === 'pro') attrs.member_tier = 'pro'

  // 4. Insert subscriber
  const [subscriber] = await db
    .insert(subscribers)
    .values({ email: email as string })
    .returning()

  // 5. Insert subscriber attributes
  for (const [key, value] of Object.entries(attrs)) {
    await addAttribute(subscriber.id, key, value)
  }

  // 6. Insert SUBSCRIBED event
  await db.insert(events).values({ subscriberId: subscriber.id, type: 'SUBSCRIBED' })

  // 7. Sync to Resend contacts
  const contactId = await syncContact(email as string)
  if (contactId) {
    await db
      .update(subscribers)
      .set({ resendContactId: contactId })
      .where(eq(subscribers.id, subscriber.id))
  }

  // 8. Enroll in sequence
  const sequenceId = determineSequence(attrs)
  await enrollIfNotEnrolled(subscriber.id, sequenceId)

  // 9. Price alert subscription for deal + buying intent
  if ((attrs.intent === 'deal' || attrs.intent === 'buying') && attrs.product_id && attrs.category) {
    await createAlertSubscription(subscriber.id, attrs.product_id, attrs.category)
  }

  // 10. Return
  return Response.json({ success: true, isNew: true }, { headers: corsHeaders })
}
