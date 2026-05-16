import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { sequenceSteps } from '@/db/schema'
import { isAdminAuthorized, unauthorized } from '../../middleware'

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isAdminAuthorized(request)) return unauthorized()

  const { id } = await params
  const body = await request.json() as {
    dayOffset?:    number
    subject?:      string
    previewText?:  string
    bodyHtml?:     string
    conditionKey?: 'not_pro' | 'has_clicked_amazon' | 'has_use_case_tag' | null
    active?:       boolean
  }

  const [updated] = await db
    .update(sequenceSteps)
    .set({ ...body, updatedAt: new Date() })
    .where(eq(sequenceSteps.id, id))
    .returning()

  if (!updated) return Response.json({ error: 'Not found' }, { status: 404 })
  return Response.json(updated)
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isAdminAuthorized(request)) return unauthorized()

  const { id } = await params
  await db.delete(sequenceSteps).where(eq(sequenceSteps.id, id))
  return new Response(null, { status: 204 })
}
