import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { alertTemplates } from '@/db/schema'
import { isAdminAuthorized, unauthorized } from '../../middleware'

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isAdminAuthorized(request)) return unauthorized()

  const { id } = await params
  const { intent, conditionKey, subject, previewText, bodyHtml, active } =
    await request.json() as {
      intent?:       string | null
      conditionKey?: string | null
      subject:       string
      previewText:   string
      bodyHtml:      string
      active:        boolean
    }

  const [updated] = await db
    .update(alertTemplates)
    .set({ intent: intent ?? null, conditionKey: (conditionKey ?? null) as never, subject, previewText, bodyHtml, active, updatedAt: new Date() })
    .where(eq(alertTemplates.id, id))
    .returning()

  if (!updated) return Response.json({ error: 'Not found' }, { status: 404 })
  return Response.json(updated)
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isAdminAuthorized(request)) return unauthorized()

  const { id } = await params
  await db.delete(alertTemplates).where(eq(alertTemplates.id, id))
  return new Response(null, { status: 204 })
}
