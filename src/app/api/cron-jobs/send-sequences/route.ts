import React from 'react'
import { and, asc, eq, lte } from 'drizzle-orm'
import { render } from '@react-email/render'
import { db } from '@/db'
import { sequenceEnrollments, sequenceSteps, subscribers } from '@/db/schema'
import type { SubscriberAttribute } from '@/db/schema'
import { getAttributes } from '@/lib/attributes'
import { resolveVariables } from '@/lib/interpolate'
import { advanceStep, enrollIfNotEnrolled } from '@/lib/enrollment'
import { resend } from '@/lib/resend'
import { EmailWrapper } from '@/emails/wrapper'

const FROM_EMAIL = 'shouldit <hello@shouldit.com>'
const ENGAGE_URL = 'https://engage.shouldit.com'

function isAuthorized(request: Request): boolean {
  return request.headers.get('authorization') === `Bearer ${process.env.CRON_SECRET}`
}

function checkCondition(key: string | null, tags: SubscriberAttribute[]): boolean {
  if (!key) return true

  // not_pro — Pro upsell emails (Buying-D7, Research-D7, Data-D5).
  // Skip if subscriber already upgraded: email is pointless and annoying.
  if (key === 'not_pro') return !tags.some(t => t.key === 'member_tier' && t.value === 'pro')

  // has_clicked_amazon — price follow-up emails.
  // Skip if subscriber already clicked affiliate link: likely already purchased, no need to push further.
  if (key === 'has_clicked_amazon') return tags.some(t => t.key === 'clicked' && t.value === 'amazon')

  // has_use_case_tag — Research-D7 personalized pick (uses {{use_case}}).
  // Skip if subscriber hasn't clicked the quiz in Research-D4: no use_case tag means no data to personalize,
  // email would render with a broken variable.
  if (key === 'has_use_case_tag') return tags.some(t => t.key === 'use_case')

  // price_status_* — send only when the current price matches the expected status.
  // price_status is resolved at send time from product metadata ({{price_status}} variable).
  if (key === 'price_status_good') return tags.some(t => t.key === 'price_status' && t.value === 'good')
  if (key === 'price_status_fair') return tags.some(t => t.key === 'price_status' && t.value === 'fair')
  if (key === 'price_status_high') return tags.some(t => t.key === 'price_status' && t.value === 'high')

  return true
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date()

  const active = await db
    .select({ enrollment: sequenceEnrollments, email: subscribers.email })
    .from(sequenceEnrollments)
    .innerJoin(subscribers, eq(sequenceEnrollments.subscriberId, subscribers.id))
    .where(and(
      eq(sequenceEnrollments.status, 'ACTIVE'),
      lte(sequenceEnrollments.nextSendAt, now),
    ))

  let sent = 0
  let skipped = 0

  for (const { enrollment, email } of active) {
    try {
      const steps = await db
        .select()
        .from(sequenceSteps)
        .where(and(
          eq(sequenceSteps.sequenceId, enrollment.sequenceId),
          eq(sequenceSteps.active, true),
        ))
        .orderBy(asc(sequenceSteps.position))

      if (!steps.length) { skipped++; continue }

      const step = steps[enrollment.step]

      if (!step) {
        await advanceStep(enrollment, steps)
        await enrollIfNotEnrolled(enrollment.subscriberId, 'crosssell_survey')
        continue
      }

      const tags = await getAttributes(enrollment.subscriberId)

      if (!checkCondition(step.conditionKey, tags)) {
        await advanceStep(enrollment, steps)
        skipped++
        continue
      }

      const unsubscribeUrl = `${ENGAGE_URL}/unsubscribe?sid=${enrollment.subscriberId}`

      const [resolvedBody, resolvedSubject] = await Promise.all([
        resolveVariables(step.bodyHtml, tags),
        resolveVariables(step.subject, tags),
      ])

      const html = await render(
        React.createElement(EmailWrapper, {
          previewText: step.previewText,
          bodyHtml:    resolvedBody,
          unsubscribeUrl,
        })
      )

      await resend.emails.send({ from: FROM_EMAIL, to: [email], subject: resolvedSubject, html })

      const nextIndex = enrollment.step + 1
      await advanceStep(enrollment, steps)
      if (nextIndex >= steps.length) {
        await enrollIfNotEnrolled(enrollment.subscriberId, 'crosssell_survey')
      }

      sent++
    } catch (err) {
      console.error(`[send-sequences] failed for enrollment ${enrollment.id}:`, err)
    }
  }

  return Response.json({ ok: true, sent, skipped })
}
