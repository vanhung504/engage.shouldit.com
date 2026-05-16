import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export async function POST(request: Request) {
  const form = await request.formData()
  const password = form.get('password') as string

  if (!password || password !== process.env.ADMIN_SECRET) {
    redirect('/admin?error=1')
  }

  const jar = await cookies()
  jar.set('admin_token', process.env.ADMIN_SECRET!, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge:   60 * 60 * 24 * 7,  // 7 days
    path:     '/',
  })

  redirect('/admin')
}
