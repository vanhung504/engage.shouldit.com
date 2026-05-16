import React from 'react'
import { and, desc, eq, gt, isNull, or } from 'drizzle-orm'
import { render } from '@react-email/render'
import { db } from '@/db'
import { alertSubscriptions, alertTemplates, alertSendLog, subscribers } from '@/db/schema'
import { fetchProductMeta } from '@/lib/interpolate'
import { resolveVariables } from '@/lib/interpolate'
import { getAttributes } from '@/lib/attributes'
import { resend } from '@/lib/resend'
import { EmailWrapper } from '@/emails/wrapper'

const FROM_EMAIL   = 'shouldit <hello@shouldit.com>'
const ENGAGE_URL   = 'https://engage.shouldit.com'

// Price drop thresholds
const NEAR_LOW_FACTOR   = 1.10  // price must be within 10% of historical low
const MIN_DROP_DOLLARS  = 5     // must drop ≥ $5 from last alert price
const COOLDOWN_DAYS     = 30    // min days between alerts

function isAuthorized(request: Request): boolean {
  return request.headers.get('authorization') === `Bearer ${process.env.CRON_SECRET}`
}

function parsePrice(raw: string): number {
  return parseFloat(raw.replace(/[^0-9.]/g, ''))
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date()

  // Active subscriptions that haven't expired
  const activeSubs = await db
    .select({
      sub:   alertSubscriptions,
      email: subscribers.email,
    })
    .from(alertSubscriptions)
    .innerJoin(subscribers, eq(alertSubscriptions.subscriberId, subscribers.id))
    .where(and(
      eq(alertSubscriptions.active, true),
      gt(alertSubscriptions.expiresAt, now),
      eq(subscribers.status, 'ACTIVE'),
    ))

  let sent    = 0
  let skipped = 0

  for (const { sub, email } of activeSubs) {
    try {
      // Fetch current product pricing
      const meta = await fetchProductMeta(sub.productId)
      if (!meta) { skipped++; continue }

      const currentPrice    = parsePrice(meta.currentPrice)
      const historicalLow   = parsePrice(meta.historicalLow)

      // Condition 1: price is near historical low
      if (currentPrice > historicalLow * NEAR_LOW_FACTOR) { skipped++; continue }

      // Get last alert sent for this subscriber + product
      const [lastLog] = await db
        .select()
        .from(alertSendLog)
        .where(and(
          eq(alertSendLog.subscriberId, sub.subscriberId),
          eq(alertSendLog.productId, sub.productId),
        ))
        .orderBy(desc(alertSendLog.sentAt))
        .limit(1)

      // Condition 2: cooldown 30 days since last alert
      if (lastLog) {
        const daysSince = (now.getTime() - lastLog.sentAt.getTime()) / 86400000
        if (daysSince < COOLDOWN_DAYS) { skipped++; continue }
      }

      // Condition 3: price dropped ≥ $5 from last alert price
      if (lastLog) {
        const drop = Number(lastLog.priceAtSend) - currentPrice
        if (drop < MIN_DROP_DOLLARS) { skipped++; continue }
      }

      // Resolve attributes first — needed for intent matching and conditionKey
      const tags = await getAttributes(sub.subscriberId)

      const subscriberIntent = tags.find(t => t.key === 'intent')?.value ?? null

      // Get alert template: prefer specific intent match, fall back to null-intent (any)
      const templates = await db
        .select()
        .from(alertTemplates)
        .where(and(
          eq(alertTemplates.categoryId, sub.categoryId),
          eq(alertTemplates.alertType, 'price_drop'),
          eq(alertTemplates.active, true),
          or(
            subscriberIntent ? eq(alertTemplates.intent, subscriberIntent) : isNull(alertTemplates.intent),
            isNull(alertTemplates.intent),
          ),
        ))

      const template =
        templates.find(t => t.intent === subscriberIntent) ??
        templates.find(t => t.intent === null)

      if (!template) { skipped++; continue }

      // Check subscriber-level condition
      if (template.conditionKey) {
        const key = template.conditionKey
        const pass =
          key === 'not_pro'            ? !tags.some(t => t.key === 'member_tier' && t.value === 'pro') :
          key === 'has_clicked_amazon' ?  tags.some(t => t.key === 'clicked'     && t.value === 'amazon') :
          key === 'has_use_case_tag'   ?  tags.some(t => t.key === 'use_case') :
          key === 'price_status_good'  ?  tags.some(t => t.key === 'price_status' && t.value === 'good') :
          key === 'price_status_fair'  ?  tags.some(t => t.key === 'price_status' && t.value === 'fair') :
          key === 'price_status_high'  ?  tags.some(t => t.key === 'price_status' && t.value === 'high') :
          true
        if (!pass) { skipped++; continue }
      }
      const unsubscribeUrl = `${ENGAGE_URL}/unsubscribe?sid=${sub.subscriberId}`

      const [resolvedBody, resolvedSubject] = await Promise.all([
        resolveVariables(template.bodyHtml, tags),
        resolveVariables(template.subject, tags),
      ])

      const html = await render(
        React.createElement(EmailWrapper, {
          previewText: template.previewText,
          bodyHtml:    resolvedBody,
          unsubscribeUrl,
        })
      )

      const { data } = await resend.emails.send({
        from:    FROM_EMAIL,
        to:      [email],
        subject: resolvedSubject,
        html,
      })

      // Log the send
      await db.insert(alertSendLog).values({
        subscriberId:  sub.subscriberId,
        templateId:    template.id,
        productId:     sub.productId,
        priceAtSend:   String(currentPrice),
        resendEmailId: data?.id ?? null,
      })

      sent++
    } catch (err) {
      console.error(`[price-check] failed for subscription ${sub.id}:`, err)
    }
  }

  return Response.json({ ok: true, sent, skipped })
}
