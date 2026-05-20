import React from 'react'
import { and, asc, desc, eq } from 'drizzle-orm'
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

function groupByDay<T extends { dayOffset: number }>(steps: T[]): { dayOffset: number; steps: T[] }[] {
	const map = new Map<number, T[]>()
	for (const step of steps) {
		if (!map.has(step.dayOffset)) map.set(step.dayOffset, [])
		map.get(step.dayOffset)!.push(step)
	}
	return [...map.entries()].map(([dayOffset, steps]) => ({ dayOffset, steps }))
}

export async function sendEnrollmentStep(
	enrollment: SequenceEnrollment,
	subscriber: SubscriberCtx,
): Promise<StepResult> {
	const allSteps = await db
		.select()
		.from(sequenceSteps)
		.where(and(
			eq(sequenceSteps.sequenceId, enrollment.sequenceId),
			eq(sequenceSteps.active, true),
		))
		.orderBy(asc(sequenceSteps.position))

	if (!allSteps.length) {
		console.log('[sendEnrollmentStep] no active steps in sequence')
		return 'no_steps'
	}

	// enrollment.step is a day-group index, not a flat step index.
	// Each day can have multiple steps (e.g. one per price_status); only the matching one is sent.
	const groups = groupByDay(allSteps)
	const currentGroup = groups[enrollment.step]

	console.log('[sendEnrollmentStep]', { enrollmentId: enrollment.id, step: enrollment.step, totalDays: groups.length })

	if (!currentGroup) {
		console.log('[sendEnrollmentStep] no more day groups — completed')
		await advanceStep(enrollment, groups)
		await enrollIfNotEnrolled(enrollment.subscriberId, 'crosssell_survey')
		return 'completed'
	}

	const productMeta = enrollment.productId
		? await fetchProductMeta(enrollment.productId)
		: null

	console.log('[sendEnrollmentStep] productMeta', productMeta ? { price_status: productMeta.price_status } : null)

	const conditionCtx: ConditionCtx = {
		memberTier:  subscriber.meta?.member_tier,
		priceStatus: productMeta?.price_status,
	}

	// Pick the first step in this day group whose condition matches
	const step = currentGroup.steps.find(s => checkCondition(s.conditionKey, conditionCtx)) ?? null

	console.log('[sendEnrollmentStep] day', { dayOffset: currentGroup.dayOffset, candidates: currentGroup.steps.length, matched: step?.id ?? null, conditionCtx })

	if (!step) {
		await advanceStep(enrollment, groups)
		return 'skipped'
	}

	const unsubscribeUrl = `${ENGAGE_URL}/unsubscribe?sid=${subscriber.id}`
	const category = enrollment.sequenceId.split('_')[0]
	const ctx = { sid: subscriber.id, category, meta: enrollment.meta }

	const resolvedSubject     = resolveVariables(step.subject,     ctx, productMeta)
	const resolvedPreviewText = resolveVariables(step.previewText, ctx, productMeta)
	const resolvedBody        = resolveVariables(step.bodyHtml,    ctx, productMeta)

	const html = await render(
		React.createElement(EmailWrapper, {
			previewText: resolvedPreviewText,
			bodyHtml:    resolvedBody,
			unsubscribeUrl,
		})
	)

	const [prevLog] = await db
		.select({ resendEmailId: sequenceSendLog.resendEmailId })
		.from(sequenceSendLog)
		.where(eq(sequenceSendLog.enrollmentId, enrollment.id))
		.orderBy(desc(sequenceSendLog.sentAt))
		.limit(1)

	const threadHeaders = prevLog?.resendEmailId ? {
		'In-Reply-To': prevLog.resendEmailId,
		'References':  prevLog.resendEmailId,
	} : undefined

	const { data } = await resend.emails.send({
		from: FROM_EMAIL, to: [subscriber.email], subject: resolvedSubject, html,
		...(threadHeaders ? { headers: threadHeaders } : {}),
	})

	await db.insert(sequenceSendLog).values({
		enrollmentId:  enrollment.id,
		stepId:        step.id,
		resendEmailId: data?.id ?? null,
	})

	const nextIndex = enrollment.step + 1
	await advanceStep(enrollment, groups)
	if (nextIndex >= groups.length) {
		await enrollIfNotEnrolled(enrollment.subscriberId, 'crosssell_survey')
	}

	return 'sent'
}

export async function sendStep0(subscriberId: string): Promise<void> {
	console.log('[sendStep0] start', { subscriberId })
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

	if (!row) {
		console.log('[sendStep0] no active enrollment at step 0 — skipping')
		return
	}

	console.log('[sendStep0] enrollment found', { enrollmentId: row.enrollment.id, sequenceId: row.enrollment.sequenceId, email: row.email })
	const result = await sendEnrollmentStep(row.enrollment, { id: subscriberId, email: row.email, meta: row.meta })
	console.log('[sendStep0] result', result)
}
