import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { products } from '@/db/schema'
import { isAdminAuthorized, unauthorized } from '@/app/api/admin/middleware'

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isAdminAuthorized(request)) return unauthorized()

  const { id } = await params
  const { name, meta } = await request.json()

  const [row] = await db.update(products)
    .set({ name, meta, updatedAt: new Date() })
    .where(eq(products.id, id))
    .returning()

  if (!row) return Response.json({ error: 'Not found' }, { status: 404 })
  return Response.json(row)
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isAdminAuthorized(request)) return unauthorized()

  const { id } = await params
  await db.delete(products).where(eq(products.id, id))
  return Response.json({ ok: true })
}
