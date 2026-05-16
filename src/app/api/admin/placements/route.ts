import { db } from '@/db'
import { pagePlacements, optInConfigs } from '@/db/schema'
import { isAdminAuthorized, unauthorized } from '../middleware'

export async function POST(request: Request) {
  if (!isAdminAuthorized(request)) return unauthorized()

  const { categoryId, pageType, label, position, optIn } =
    await request.json() as {
      categoryId: string
      pageType:   'review' | 'best'
      label:      string
      position:   number
      optIn:      { intent: string; title: string; subtitle: string; cta: string; trust?: string }
    }

  const [placement] = await db.insert(pagePlacements).values({
    categoryId, pageType, label, position, active: false,
  }).returning()

  await db.insert(optInConfigs).values({
    placementId: placement.id,
    intent:      optIn.intent,
    title:       optIn.title,
    subtitle:    optIn.subtitle,
    cta:         optIn.cta,
    trust:       optIn.trust ?? null,
  })

  return Response.json(placement, { status: 201 })
}
