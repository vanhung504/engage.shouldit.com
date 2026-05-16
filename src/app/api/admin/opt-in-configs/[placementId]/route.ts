import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { optInConfigs } from '@/db/schema'
import { isAdminAuthorized, unauthorized } from '../../middleware'

export async function GET(request: Request, { params }: { params: Promise<{ placementId: string }> }) {
  if (!isAdminAuthorized(request)) return unauthorized()

  const { placementId } = await params
  const rows = await db
    .select()
    .from(optInConfigs)
    .where(eq(optInConfigs.placementId, placementId))
    .limit(1)

  if (!rows.length) return Response.json({ error: 'Not found' }, { status: 404 })
  return Response.json(rows[0])
}

export async function PUT(request: Request, { params }: { params: Promise<{ placementId: string }> }) {
  if (!isAdminAuthorized(request)) return unauthorized()

  const { placementId } = await params
  const { intent, title, subtitle, cta, trust, previewVars } =
    await request.json() as {
      intent:       string
      title:        string
      subtitle:     string
      cta:          string
      trust?:       string
      previewVars?: Record<string, string>
    }

  const existing = await db
    .select({ id: optInConfigs.id })
    .from(optInConfigs)
    .where(eq(optInConfigs.placementId, placementId))
    .limit(1)

  if (existing.length > 0) {
    const [updated] = await db
      .update(optInConfigs)
      .set({ intent, title, subtitle, cta, trust: trust ?? null, previewVars: previewVars ?? null, updatedAt: new Date() })
      .where(eq(optInConfigs.placementId, placementId))
      .returning()
    return Response.json(updated)
  }

  const [created] = await db
    .insert(optInConfigs)
    .values({ placementId, intent, title, subtitle, cta, trust: trust ?? null, previewVars: previewVars ?? null })
    .returning()
  return Response.json(created, { status: 201 })
}
