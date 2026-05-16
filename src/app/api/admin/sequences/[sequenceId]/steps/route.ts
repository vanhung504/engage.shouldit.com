import { asc, eq } from 'drizzle-orm'
import { db } from '@/db'
import { sequenceSteps } from '@/db/schema'
import { isAdminAuthorized, unauthorized } from '../../../middleware'

export async function GET(request: Request, { params }: { params: Promise<{ sequenceId: string }> }) {
  if (!isAdminAuthorized(request)) return unauthorized()

  const { sequenceId } = await params

  const steps = await db
    .select()
    .from(sequenceSteps)
    .where(eq(sequenceSteps.sequenceId, sequenceId))
    .orderBy(asc(sequenceSteps.position))

  return Response.json(steps)
}

export async function POST(request: Request, { params }: { params: Promise<{ sequenceId: string }> }) {
  if (!isAdminAuthorized(request)) return unauthorized()

  const { sequenceId } = await params
  const { dayOffset, subject, previewText, bodyHtml, conditionKey, position } =
    await request.json() as {
      dayOffset:     number
      subject:       string
      previewText:   string
      bodyHtml:      string
      conditionKey?: 'not_pro' | 'has_clicked_amazon' | 'has_use_case_tag'
      position:      number
    }

  const [step] = await db
    .insert(sequenceSteps)
    .values({ sequenceId, position, dayOffset, subject, previewText, bodyHtml, conditionKey: conditionKey ?? null, active: false })
    .returning()

  return Response.json(step, { status: 201 })
}
