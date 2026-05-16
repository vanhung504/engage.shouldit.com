import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { subscribers, events } from '@/db/schema'
import { verifyWebhook } from '@/lib/resend'
import { cancelEnrollments } from '@/lib/enrollment'
import { checkGraduation } from '@/lib/graduation'

type WebhookEvent = {
  type: string
  data: {
    to?:   string[]
    email?: string
    [key: string]: unknown
  }
}

function extractEmail(event: WebhookEvent): string | null {
  return event.data?.to?.[0] ?? event.data?.email ?? null
}

export async function POST(request: Request) {
  const payload = await request.text()

  let event: WebhookEvent
  try {
    event = verifyWebhook(payload, request.headers) as WebhookEvent
  } catch {
    return Response.json({ error: 'Invalid signature' }, { status: 401 })
  }

  const email = extractEmail(event)
  if (!email) return Response.json({ ok: true })

  const [subscriber] = await db
    .select()
    .from(subscribers)
    .where(eq(subscribers.email, email))
    .limit(1)

  if (!subscriber) return Response.json({ ok: true })

  switch (event.type) {
    case 'email.opened':
      await db.insert(events).values({ subscriberId: subscriber.id, type: 'EMAIL_OPENED' })
      await checkGraduation(subscriber.id)
      break

    case 'email.clicked':
      await db.insert(events).values({ subscriberId: subscriber.id, type: 'EMAIL_CLICKED' })
      break

    case 'email.bounced':
      await db.update(subscribers).set({ status: 'BOUNCED' }).where(eq(subscribers.id, subscriber.id))
      await cancelEnrollments(subscriber.id)
      break

    case 'email.complained':
      await db.update(subscribers).set({ status: 'COMPLAINED' }).where(eq(subscribers.id, subscriber.id))
      await cancelEnrollments(subscriber.id)
      break

    case 'contact.unsubscribed':
      await db.update(subscribers).set({ status: 'UNSUBSCRIBED' }).where(eq(subscribers.id, subscriber.id))
      await cancelEnrollments(subscriber.id)
      break
  }

  return Response.json({ ok: true })
}
