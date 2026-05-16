import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { pagePlacements, optInConfigs } from '@/db/schema'
import { isAdminAuthorized, unauthorized } from '../../middleware'

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isAdminAuthorized(request)) return unauthorized()

  const { id } = await params
  const rows = await db
    .select({ placement: pagePlacements, optIn: optInConfigs })
    .from(pagePlacements)
    .leftJoin(optInConfigs, eq(optInConfigs.placementId, pagePlacements.id))
    .where(eq(pagePlacements.id, id))
    .limit(1)

  if (!rows.length) return Response.json({ error: 'Not found' }, { status: 404 })
  return Response.json({ ...rows[0].placement, optIn: rows[0].optIn })
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isAdminAuthorized(request)) return unauthorized()

  const { id } = await params
  const body = await request.json() as { label?: string; active?: boolean }

  const [updated] = await db
    .update(pagePlacements)
    .set({ ...body, updatedAt: new Date() })
    .where(eq(pagePlacements.id, id))
    .returning()

  if (!updated) return Response.json({ error: 'Not found' }, { status: 404 })
  return Response.json(updated)
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isAdminAuthorized(request)) return unauthorized()

  const { id } = await params

  await db.transaction(async tx => {
    await tx.delete(optInConfigs).where(eq(optInConfigs.placementId, id))
    await tx.delete(pagePlacements).where(eq(pagePlacements.id, id))
  })

  return new Response(null, { status: 204 })
}
