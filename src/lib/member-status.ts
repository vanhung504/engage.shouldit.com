type MemberStatus = {
  tier: 'pro' | 'free'
  memberId: string
}

export async function fetchMemberStatus(email: string): Promise<MemberStatus | null> {
  const url = new URL(process.env.SHOULDIT_MEMBER_STATUS_URL!)
  url.searchParams.set('email', email)

  try {
    const res = await fetch(url.toString(), {
      headers: { 'x-api-key': process.env.ENGAGE_API_SECRET! },
    })

    if (!res.ok) return null

    return res.json() as Promise<MemberStatus>
  } catch {
    return null
  }
}
