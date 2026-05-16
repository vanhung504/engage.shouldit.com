import { and, count, eq } from 'drizzle-orm'
import { db } from '@/db'
import { events, subscriberAttributes } from '@/db/schema'
import { GRADUATION_OPEN_COUNT } from './constants'
import { addAttribute } from './attributes'

export async function checkGraduation(subscriberId: string): Promise<void> {
  const [openCount, alreadyTagged] = await Promise.all([
    db
      .select({ count: count() })
      .from(events)
      .where(and(eq(events.subscriberId, subscriberId), eq(events.type, 'EMAIL_OPENED')))
      .then(rows => rows[0]?.count ?? 0),

    db
      .select({ id: subscriberAttributes.id })
      .from(subscriberAttributes)
      .where(and(eq(subscriberAttributes.subscriberId, subscriberId), eq(subscriberAttributes.key, 'engagement'), eq(subscriberAttributes.value, 'active')))
      .then(rows => rows.length > 0),
  ])

  if (openCount >= GRADUATION_OPEN_COUNT && !alreadyTagged) {
    await addTag(subscriberId, 'engagement', 'active')
  }
}
