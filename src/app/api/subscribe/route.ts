import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { subscribers, events } from '@/db/schema'
import { determineSequence } from '@/lib/routing'
import { enrollIfNotEnrolled } from '@/lib/enrollment'
import { createAlertSubscription } from '@/lib/alerts'
import { fetchMemberStatus } from '@/lib/member-status'
import { syncContact } from '@/lib/resend'
import { sendStep0 } from '@/lib/send-step'

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
    attributes?: Record<string, unknown> // { product_id, category, intent } from widget
  }

  try {
    body = await request.json()
  } catch {
    return Response.json(
      { success: false, error: 'Invalid JSON' },
      { status: 400, headers: corsHeaders },
    )
  }

  const { email, attributes = {} } = body

  if (!isValidEmail(email)) {
    return Response.json(
      { success: false, error: 'Invalid email' },
      { status: 400, headers: corsHeaders },
    )
  }

  const attrs: Record<string, string> = {}
  for (const [key, value] of Object.entries(attributes)) {
    if (value != null) attrs[key] = String(value)
  }

  // Existing subscriber — re-enroll with new attrs and send day-0 immediately
  const [existing] = await db
    .select()
    .from(subscribers)
    .where(eq(subscribers.email, email as string))
    .limit(1)

  if (existing) {
    const sequenceId = determineSequence(attrs)
    await enrollIfNotEnrolled(existing.id, sequenceId, attrs.product_id)
    sendStep0(existing.id).catch(err => console.error('[subscribe] sendStep0 failed:', err))
    return Response.json({ success: true, isNew: false }, { headers: corsHeaders })
  }

  // Member status check — non-blocking
  const memberStatus = await fetchMemberStatus(email as string)
  const meta = memberStatus?.tier === 'pro' ? { member_tier: 'pro' as const } : {}

  // Insert subscriber
  const [subscriber] = await db
    .insert(subscribers)
    .values({ email: email as string, meta })
    .returning()

  // Insert SUBSCRIBED event
  await db.insert(events).values({ subscriberId: subscriber.id, type: 'SUBSCRIBED' })

  // Sync to Resend contacts
  const contactId = await syncContact(email as string)
  if (contactId) {
    await db
      .update(subscribers)
      .set({ resendContactId: contactId })
      .where(eq(subscribers.id, subscriber.id))
  }

  // Enroll in sequence and send day-0 email immediately
  const sequenceId = determineSequence(attrs)
  await enrollIfNotEnrolled(subscriber.id, sequenceId, attrs.product_id)
  sendStep0(subscriber.id).catch(err => console.error('[subscribe] sendStep0 failed:', err))

  // Price alert subscription for deal + buying intent
  if ((attrs.intent === 'deal' || attrs.intent === 'buying') && attrs.product_id && attrs.category) {
    const priceAtSubscription = attrs.current_price
      ? parseFloat(attrs.current_price.replace(/[^0-9.]/g, ''))
      : null
    await createAlertSubscription(subscriber.id, attrs.product_id, attrs.category, attrs.intent, priceAtSubscription)
  }

  return Response.json({ success: true, isNew: true }, { headers: corsHeaders })
}
