import { eq, sql } from 'drizzle-orm'
import { db } from '@/db'
import {
  categories, pagePlacements, optInConfigs, sequenceSteps,
} from '@/db/schema'
import { isAdminAuthorized, unauthorized } from '../middleware'

export async function GET(request: Request) {
  if (!isAdminAuthorized(request)) return unauthorized()

  const rows = await db
    .select({
      id:             categories.id,
      slug:           categories.slug,
      name:           categories.name,
      active:         categories.active,
      placementCount: sql<number>`count(${pagePlacements.id})::int`,
    })
    .from(categories)
    .leftJoin(pagePlacements, eq(pagePlacements.categoryId, categories.id))
    .groupBy(categories.id)
    .orderBy(categories.createdAt)

  return Response.json(rows)
}

export async function POST(request: Request) {
  if (!isAdminAuthorized(request)) return unauthorized()

  const { slug, name } = await request.json() as { slug: string; name: string }
  if (!slug || !name) {
    return Response.json({ error: 'slug and name are required' }, { status: 400 })
  }

  // Clone full structure from blenders
  const [blenders] = await db
    .select()
    .from(categories)
    .where(eq(categories.slug, 'blenders'))
    .limit(1)

  if (!blenders) {
    return Response.json({ error: 'blenders template not found' }, { status: 500 })
  }

  const [newCategory] = await db.insert(categories).values({ slug, name }).returning()

  // Clone placements + opt-in configs
  const sourcePlacements = await db
    .select()
    .from(pagePlacements)
    .where(eq(pagePlacements.categoryId, blenders.id))
    .orderBy(pagePlacements.pageType, pagePlacements.position)

  const placeholderOptIn = {
    title:    'Is {{current_price}} a good price for the {{product_name}} right now?',
    subtitle: "It's dropped to {{low_price}} before. We track price history.",
    cta:      'Check the price history →',
    trust:    'One email. No spam.',
  }

  for (const src of sourcePlacements) {
    const sourceOptIn = await db
      .select()
      .from(optInConfigs)
      .where(eq(optInConfigs.placementId, src.id))
      .limit(1)

    const [newPlacement] = await db.insert(pagePlacements).values({
      categoryId: newCategory.id,
      pageType:   src.pageType,
      position:   src.position,
      label:      src.label,
      active:     src.active,
    }).returning()

    const srcOptIn = sourceOptIn[0]
    await db.insert(optInConfigs).values({
      placementId: newPlacement.id,
      intent:      srcOptIn?.intent ?? 'buying',
      title:       placeholderOptIn.title,
      subtitle:    placeholderOptIn.subtitle,
      cta:         placeholderOptIn.cta,
      trust:       placeholderOptIn.trust,
    })
  }

  // Clone sequence steps with new sequenceIds
  const sourceSteps = await db
    .select()
    .from(sequenceSteps)
    .where(eq(sequenceSteps.sequenceId, 'blenders_buying'))
    .orderBy(sequenceSteps.position)

  const sequenceIdMap: Record<string, string> = {
    blenders_buying:    `${slug}_buying`,
    blenders_research:  `${slug}_research`,
    deal_hunter:        `deal_hunter`,
    power_user:         `power_user`,
    crosssell_survey:   `crosssell_survey`,
    reengagement:       `reengagement`,
  }

  const allSourceSteps = await db.select().from(sequenceSteps)

  for (const src of allSourceSteps) {
    const newSeqId = sequenceIdMap[src.sequenceId]
    if (!newSeqId || newSeqId === src.sequenceId) continue  // shared sequences, don't clone

    await db.insert(sequenceSteps).values({
      sequenceId:   newSeqId,
      position:     src.position,
      dayOffset:    src.dayOffset,
      subject:      src.subject,
      previewText:  src.previewText,
      bodyHtml:     src.bodyHtml,
      conditionKey: src.conditionKey,
      active:       src.active,
    })
  }

  // Also clone blenders_research steps
  const researchSteps = await db
    .select()
    .from(sequenceSteps)
    .where(eq(sequenceSteps.sequenceId, 'blenders_research'))
    .orderBy(sequenceSteps.position)

  for (const src of researchSteps) {
    await db.insert(sequenceSteps).values({
      sequenceId:   `${slug}_research`,
      position:     src.position,
      dayOffset:    src.dayOffset,
      subject:      src.subject,
      previewText:  src.previewText,
      bodyHtml:     src.bodyHtml,
      conditionKey: src.conditionKey,
      active:       src.active,
    })
  }

  return Response.json({ id: newCategory.id, slug: newCategory.slug, name: newCategory.name }, { status: 201 })
}
