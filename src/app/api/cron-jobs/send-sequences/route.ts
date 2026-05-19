import { and, eq, lte } from 'drizzle-orm'
import { db } from '@/db'
import { sequenceEnrollments, subscribers } from '@/db/schema'
import { sendEnrollmentStep } from '@/lib/send-step'

function isAuthorized(request: Request): boolean {
	return request.headers.get('authorization') === `Bearer ${process.env.CRON_SECRET}`
}

export async function POST(request: Request) {
	if (!isAuthorized(request)) {
		return Response.json({ error: 'Unauthorized' }, { status: 401 })
	}

	const now = new Date()

	const active = await db
		.select({
			enrollment: sequenceEnrollments,
			id:         subscribers.id,
			email:      subscribers.email,
			meta:       subscribers.meta,
		})
		.from(sequenceEnrollments)
		.innerJoin(subscribers, eq(sequenceEnrollments.subscriberId, subscribers.id))
		.where(and(
			eq(sequenceEnrollments.status, 'ACTIVE'),
			lte(sequenceEnrollments.nextSendAt, now),
		))

	let sent    = 0
	let skipped = 0

	for (const { enrollment, id, email, meta } of active) {
		try {
			const result = await sendEnrollmentStep(enrollment, { id, email, meta })
			if (result === 'sent') sent++
			else skipped++
		} catch (err) {
			console.error(`[send-sequences] failed for enrollment ${enrollment.id}:`, err)
		}
	}

	return Response.json({ ok: true, sent, skipped })
}
