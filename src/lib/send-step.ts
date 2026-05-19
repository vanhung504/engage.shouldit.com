import React from 'react'
import { and, asc, eq } from 'drizzle-orm'
import { render } from '@react-email/render'
import { db } from '@/db'
import { sequenceEnrollments, sequenceSteps, sequenceSendLog, subscribers } from '@/db/schema'
import type { SequenceEnrollment } from '@/db/schema'
import { resolveVariables, fetchProductMeta } from '@/lib/interpolate'
import { advanceStep, enrollIfNotEnrolled } from '@/lib/enrollment'
import { resend } from '@/lib/resend'
import { EmailWrapper } from '@/emails/wrapper'

const FROM_EMAIL = 'shouldit <hello@shouldit.com>'
const ENGAGE_URL = 'https://engage.shouldit.com'

type ConditionCtx = {
	memberTier?:  string | null
	priceStatus?: string
}

export function checkCondition(key: string | null, ctx: ConditionCtx): boolean {
	if (!key) return true

	// not_pro — Pro upsell emails. Skip if subscriber already upgraded.
	if (key === 'not_pro') return ctx.memberTier !== 'pro'

	// has_clicked_amazon — TODO: check events table for AFFILIATE_CLICK when implemented.
	if (key === 'has_clicked_amazon') return true

	// price_status_* — send only when current price matches expected status.
	if (key === 'price_status_all_time_low') return ctx.priceStatus === 'all-time-low'
	if (key === 'price_status_good')         return ctx.priceStatus === 'good'
	if (key === 'price_status_fair')         return ctx.priceStatus === 'fair'
	if (key === 'price_status_high')         return ctx.priceStatus === 'high'

	return true
}

export type StepResult = 'sent' | 'skipped' | 'completed' | 'no_steps'

type SubscriberCtx = {
	id:    string
	email: string
	meta:  { member_tier?: string } | null
}

export async function sendEnrollmentStep(
	enrollment: SequenceEnrollment,
	subscriber: SubscriberCtx,
): Promise<StepResult> {
	const steps = await db
		.select()
		.from(sequenceSteps)
		.where(and(
			eq(sequenceSteps.sequenceId, enrollment.sequenceId),
			eq(sequenceSteps.active, true),
		))
		.orderBy(asc(sequenceSteps.position))

	if (!steps.length) return 'no_steps'

	const step = steps[enrollment.step]

	if (!step) {
		await advanceStep(enrollment, steps)
		await enrollIfNotEnrolled(enrollment.subscriberId, 'crosssell_survey')
		return 'completed'
	}

	const productMeta = enrollment.productId
		? await fetchProductMeta(enrollment.productId)
		: null

	const conditionCtx: ConditionCtx = {
		memberTier:  subscriber.meta?.member_tier,
		priceStatus: productMeta?.price_status,
	}

	if (!checkCondition(step.conditionKey, conditionCtx)) {
		await advanceStep(enrollment, steps)
		return 'skipped'
	}

	const unsubscribeUrl = `${ENGAGE_URL}/unsubscribe?sid=${subscriber.id}`
	const category = enrollment.sequenceId.split('_')[0]
	const ctx = { sid: subscriber.id, category, meta: enrollment.meta }

	const resolvedBody    = resolveVariables(step.bodyHtml, ctx, productMeta)
	const resolvedSubject = resolveVariables(step.subject,  ctx, productMeta)

	const html = await render(
		React.createElement(EmailWrapper, {
			previewText: step.previewText,
			bodyHtml:    resolvedBody,
			unsubscribeUrl,
		})
	)

	const { data } = await resend.emails.send({ from: FROM_EMAIL, to: [subscriber.email], subject: resolvedSubject, html })

	await db.insert(sequenceSendLog).values({
		enrollmentId:  enrollment.id,
		stepId:        step.id,
		resendEmailId: data?.id ?? null,
	})

	const nextIndex = enrollment.step + 1
	await advanceStep(enrollment, steps)
	if (nextIndex >= steps.length) {
		await enrollIfNotEnrolled(enrollment.subscriberId, 'crosssell_survey')
	}

	return 'sent'
}

export async function sendStep0(subscriberId: string): Promise<void> {
	const [row] = await db
		.select({
			enrollment: sequenceEnrollments,
			email:      subscribers.email,
			meta:       subscribers.meta,
		})
		.from(sequenceEnrollments)
		.innerJoin(subscribers, eq(sequenceEnrollments.subscriberId, subscribers.id))
		.where(and(
			eq(sequenceEnrollments.subscriberId, subscriberId),
			eq(sequenceEnrollments.status, 'ACTIVE'),
			eq(sequenceEnrollments.step, 0),
		))
		.limit(1)

	if (!row) return

	await sendEnrollmentStep(row.enrollment, { id: subscriberId, email: row.email, meta: row.meta })
}
