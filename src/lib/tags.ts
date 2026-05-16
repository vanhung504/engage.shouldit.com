import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { subscriberAttributes } from '@/db/schema'
import type { SubscriberAttribute } from '@/db/schema'

export async function addTag(subscriberId: string, key: string, value: string): Promise<void> {
  await db.insert(subscriberAttributes).values({ subscriberId, key, value }).onConflictDoNothing()
}

export function hasTag(tagList: SubscriberAttribute[], key: string, value?: string): boolean {
  return tagList.some(t => t.key === key && (value === undefined || t.value === value))
}

export async function getTags(subscriberId: string): Promise<SubscriberAttribute[]> {
  return db.select().from(subscriberAttributes).where(eq(subscriberAttributes.subscriberId, subscriberId))
}
