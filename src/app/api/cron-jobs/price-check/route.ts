import React from 'react'
import { and, desc, eq, gt, isNull, or } from 'drizzle-orm'
import { render } from '@react-email/render'
import { db } from '@/db'
import { alertSubscriptions, alertTemplates, alertSendLog, subscribers } from '@/db/schema'
import { fetchProductMeta, resolveVariables } from '@/lib/interpolate'
import { checkCondition } from '@/lib/send-step'
import { resend } from '@/lib/resend'
import { EmailWrapper } from '@/emails/wrapper'

const FROM_EMAIL   = 'shouldit <hello@shouldit.com>'
const ENGAGE_URL   = 'https://engage.shouldit.com'

const COOLDOWN_DAYS    = 2     // min days between alerts
const MIN_DROP_PERCENT = 0.05  // must drop ≥ 5% from last alert price

const GOOD_STATUSES = new Set(['all-time-low', 'good'])

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

  const activeSubs = await db
    .select({
      sub:            alertSubscriptions,
      email:          subscribers.email,
      subscriberMeta: subscribers.meta,
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

  for (const { sub, email, subscriberMeta } of activeSubs) {
    try {
      const productMeta = await fetchProductMeta(sub.productId)
      if (!productMeta) { skipped++; continue }

      const currentPrice = parsePrice(productMeta.currentPrice ?? '')

      // Condition 1: price must be lower than when subscriber signed up
      if (sub.priceAtSubscription != null && currentPrice >= Number(sub.priceAtSubscription)) {
        skipped++; continue
      }

      // Condition 2: price_status must be good or better
      if (!GOOD_STATUSES.has(productMeta.price_status ?? '')) { skipped++; continue }

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

      // Condition 3: cooldown since last alert
      if (lastLog) {
        const daysSince = (now.getTime() - lastLog.sentAt.getTime()) / 86400000
        if (daysSince < COOLDOWN_DAYS) { skipped++; continue }
      }

      // Condition 4: price dropped ≥ 5% from last alert price
      if (lastLog) {
        const dropPct = (Number(lastLog.priceAtSend) - currentPrice) / Number(lastLog.priceAtSend)
        if (dropPct < MIN_DROP_PERCENT) { skipped++; continue }
      }

      const subscriberIntent = sub.intent ?? null

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

      if (template.conditionKey) {
        const pass = checkCondition(template.conditionKey, {
          memberTier:  subscriberMeta?.member_tier,
          priceStatus: productMeta.price_status,
        })
        if (!pass) { skipped++; continue }
      }

      const unsubscribeUrl = `${ENGAGE_URL}/unsubscribe?sid=${sub.subscriberId}`
      const resolvedBody    = resolveVariables(template.bodyHtml, { sid: sub.subscriberId }, productMeta)
      const resolvedSubject = resolveVariables(template.subject,  { sid: sub.subscriberId }, productMeta)

      const html = await render(
        React.createElement(EmailWrapper, {
          previewText: template.previewText,
          bodyHtml:    resolvedBody,
          unsubscribeUrl,
        })
      )

      const threadHeaders = lastLog?.resendEmailId ? {
        'In-Reply-To': lastLog.resendEmailId,
        'References':  lastLog.resendEmailId,
      } : undefined

      const { data } = await resend.emails.send({
        from:    FROM_EMAIL,
        to:      [email],
        subject: resolvedSubject,
        html,
        ...(threadHeaders ? { headers: threadHeaders } : {}),
      })

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
