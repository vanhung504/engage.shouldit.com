import { and, eq, inArray } from 'drizzle-orm'
import { db } from '@/db'
import { sequenceEnrollments } from '@/db/schema'
import type { SequenceEnrollment } from '@/db/schema'
export async function enrollIfNotEnrolled(
  subscriberId: string,
  sequenceId: string,
): Promise<void> {
  await db
    .insert(sequenceEnrollments)
    .values({ subscriberId, sequenceId, nextSendAt: new Date() })
    .onConflictDoNothing()
}

export async function advanceStep(
  enrollment: SequenceEnrollment,
  steps: { dayOffset: number }[],
): Promise<void> {
  const nextIndex = enrollment.step + 1

  if (nextIndex >= steps.length) {
    await db
      .update(sequenceEnrollments)
      .set({ status: 'COMPLETED', completedAt: new Date() })
      .where(eq(sequenceEnrollments.id, enrollment.id))
    return
  }

  const nextStep = steps[nextIndex]
  const nextSendAt = new Date(enrollment.enrolledAt)
  nextSendAt.setDate(nextSendAt.getDate() + nextStep.dayOffset)

  await db
    .update(sequenceEnrollments)
    .set({ step: nextIndex, nextSendAt })
    .where(eq(sequenceEnrollments.id, enrollment.id))
}

export async function cancelEnrollments(
  subscriberId: string,
  sequenceIds?: string[],
): Promise<void> {
  const conditions = sequenceIds
    ? and(
        eq(sequenceEnrollments.subscriberId, subscriberId),
        inArray(sequenceEnrollments.sequenceId, sequenceIds),
      )
    : eq(sequenceEnrollments.subscriberId, subscriberId)

  await db
    .update(sequenceEnrollments)
    .set({ status: 'CANCELLED' })
    .where(conditions)
}
