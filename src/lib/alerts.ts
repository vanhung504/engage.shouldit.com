import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { alertSubscriptions, categories } from '@/db/schema'
import { createId } from '@paralleldrive/cuid2'

const ALERT_EXPIRES_DAYS = 90

export async function createAlertSubscription(
  subscriberId:        string,
  productId:           string,
  categorySlug:        string,
  intent?:             string | null,
  priceAtSubscription?: number | null,
): Promise<void> {
  const [cat] = await db
    .select({ id: categories.id })
    .from(categories)
    .where(eq(categories.slug, categorySlug))
    .limit(1)

  if (!cat) return

  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + ALERT_EXPIRES_DAYS)

  await db
    .insert(alertSubscriptions)
    .values({
      id: createId(),
      subscriberId,
      categoryId:          cat.id,
      productId,
      intent:              intent ?? null,
      priceAtSubscription: priceAtSubscription != null ? String(priceAtSubscription) : null,
      expiresAt,
    })
    .onConflictDoNothing()
}
