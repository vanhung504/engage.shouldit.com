import { count, eq, inArray } from 'drizzle-orm'
import { db } from '@/db'
import { categories, pagePlacements, optInConfigs, sequenceSteps } from '@/db/schema'
import { isAdminAuthorized, unauthorized } from '../../../middleware'

function deriveSequenceId(categorySlug: string, intent: string): string {
  if (intent === 'deal') return 'deal_hunter'
  if (intent === 'data') return 'power_user'
  return `${categorySlug}_${intent}`
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isAdminAuthorized(request)) return unauthorized()

  const { id: categoryId } = await params

  const [[cat], rows] = await Promise.all([
    db.select({ slug: categories.slug }).from(categories).where(eq(categories.id, categoryId)).limit(1),
    db
      .select({ placement: pagePlacements, optIn: optInConfigs })
      .from(pagePlacements)
      .leftJoin(optInConfigs, eq(optInConfigs.placementId, pagePlacements.id))
      .where(eq(pagePlacements.categoryId, categoryId))
      .orderBy(pagePlacements.pageType, pagePlacements.position),
  ])

  const categorySlug = cat?.slug ?? ''

  const seqIds = [...new Set(
    rows.map(r => r.optIn?.intent).filter(Boolean).map(i => deriveSequenceId(categorySlug, i!)),
  )]

  const stepCounts: Record<string, number> = {}
  if (seqIds.length > 0) {
    const counts = await db
      .select({ sequenceId: sequenceSteps.sequenceId, n: count() })
      .from(sequenceSteps)
      .where(inArray(sequenceSteps.sequenceId, seqIds))
      .groupBy(sequenceSteps.sequenceId)
    counts.forEach(c => { stepCounts[c.sequenceId] = c.n })
  }

  const toRow = (r: typeof rows[number]) => {
    const intent = r.optIn?.intent ?? ''
    const seqId  = intent ? deriveSequenceId(categorySlug, intent) : ''
    return { ...r.placement, optIn: r.optIn, stepCount: seqId ? (stepCounts[seqId] ?? 0) : null }
  }

  return Response.json({
    review: rows.filter(r => r.placement.pageType === 'review').map(toRow),
    best:   rows.filter(r => r.placement.pageType === 'best').map(toRow),
  })
}
