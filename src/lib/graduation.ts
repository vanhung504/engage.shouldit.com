import { and, count, eq } from 'drizzle-orm'
import { db } from '@/db'
import { events, subscribers } from '@/db/schema'
import { GRADUATION_OPEN_COUNT } from './constants'

export async function checkGraduation(subscriberId: string): Promise<void> {
  const [subscriber, openCount] = await Promise.all([
    db
      .select({ meta: subscribers.meta })
      .from(subscribers)
      .where(eq(subscribers.id, subscriberId))
      .then(rows => rows[0] ?? null),

    db
      .select({ count: count() })
      .from(events)
      .where(and(eq(events.subscriberId, subscriberId), eq(events.type, 'EMAIL_OPENED')))
      .then(rows => rows[0]?.count ?? 0),
  ])

  if (!subscriber || subscriber.meta.engagement === 'active') return

  if (openCount >= GRADUATION_OPEN_COUNT) {
    await db
      .update(subscribers)
      .set({ meta: { ...subscriber.meta, engagement: 'active' } })
      .where(eq(subscribers.id, subscriberId))
  }
}
