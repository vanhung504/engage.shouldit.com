import { Resend } from 'resend'

export const resend = new Resend(process.env.RESEND_API_KEY!)

export async function syncContact(email: string): Promise<string | null> {
  const { data, error } = await resend.contacts.create({
    email,
    audienceId: process.env.RESEND_AUDIENCE_ID!,
  } as Parameters<typeof resend.contacts.create>[0])

  if (error) {
    console.error('[resend] syncContact failed:', error)
    return null
  }

  return data?.id ?? null
}

export function verifyWebhook(
  payload: string,
  headers: Headers,
): ReturnType<typeof resend.webhooks.verify> {
  return resend.webhooks.verify({
    payload,
    headers,
    webhookSecret: process.env.RESEND_WEBHOOK_SECRET!,
  })
}
