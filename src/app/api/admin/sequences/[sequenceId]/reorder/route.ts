import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { sequenceSteps } from '@/db/schema'
import { isAdminAuthorized, unauthorized } from '../../../middleware'

export async function PATCH(request: Request, { params }: { params: Promise<{ sequenceId: string }> }) {
  if (!isAdminAuthorized(request)) return unauthorized()

  await params  // sequenceId available if needed for validation
  const { items } = await request.json() as { items: { id: string; position: number }[] }

  await db.transaction(async tx => {
    for (const { id, position } of items) {
      await tx
        .update(sequenceSteps)
        .set({ position, updatedAt: new Date() })
        .where(eq(sequenceSteps.id, id))
    }
  })

  return Response.json({ ok: true })
}
