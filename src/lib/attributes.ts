import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { subscriberAttributes } from '@/db/schema'
import type { SubscriberAttribute } from '@/db/schema'

export async function addAttribute(subscriberId: string, key: string, value: string): Promise<void> {
  await db.insert(subscriberAttributes).values({ subscriberId, key, value }).onConflictDoNothing()
}

export function hasAttribute(attrList: SubscriberAttribute[], key: string, value?: string): boolean {
  return attrList.some(t => t.key === key && (value === undefined || t.value === value))
}

export async function getAttributes(subscriberId: string): Promise<SubscriberAttribute[]> {
  return db.select().from(subscriberAttributes).where(eq(subscriberAttributes.subscriberId, subscriberId))
}
