import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { alertTemplates } from '@/db/schema'
import { isAdminAuthorized, unauthorized } from '../middleware'
import { createId } from '@paralleldrive/cuid2'

export async function GET(request: Request) {
  if (!isAdminAuthorized(request)) return unauthorized()

  const categoryId = new URL(request.url).searchParams.get('categoryId')
  if (!categoryId) return Response.json({ error: 'categoryId required' }, { status: 400 })

  const rows = await db
    .select()
    .from(alertTemplates)
    .where(eq(alertTemplates.categoryId, categoryId))

  return Response.json(rows)
}

export async function POST(request: Request) {
  if (!isAdminAuthorized(request)) return unauthorized()

  const { categoryId, alertType, intent, conditionKey, subject, previewText, bodyHtml } =
    await request.json() as {
      categoryId:   string
      alertType:    string
      intent?:      string | null
      conditionKey?: string | null
      subject:      string
      previewText:  string
      bodyHtml:     string
    }

  const [created] = await db
    .insert(alertTemplates)
    .values({ id: createId(), categoryId, alertType, intent: intent ?? null, conditionKey: (conditionKey ?? null) as never, subject, previewText, bodyHtml, active: false })
    .returning()

  return Response.json(created, { status: 201 })
}
