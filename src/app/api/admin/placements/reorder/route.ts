import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { pagePlacements } from '@/db/schema'
import { isAdminAuthorized, unauthorized } from '../../middleware'

export async function PATCH(request: Request) {
  if (!isAdminAuthorized(request)) return unauthorized()

  const { items } = await request.json() as { items: { id: string; position: number }[] }

  await db.transaction(async tx => {
    for (const { id, position } of items) {
      await tx
        .update(pagePlacements)
        .set({ position, updatedAt: new Date() })
        .where(eq(pagePlacements.id, id))
    }
  })

  return Response.json({ ok: true })
}
