import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { categories } from '@/db/schema'
import { isAdminAuthorized, unauthorized } from '../../middleware'

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isAdminAuthorized(request)) return unauthorized()

  const { id } = await params
  const body = await request.json() as { name?: string; active?: boolean }

  const [updated] = await db
    .update(categories)
    .set({ ...body, updatedAt: new Date() })
    .where(eq(categories.id, id))
    .returning()

  if (!updated) return Response.json({ error: 'Not found' }, { status: 404 })
  return Response.json(updated)
}
