export function isAdminAuthorized(request: Request): boolean {
  const secret = process.env.ADMIN_SECRET
  if (!secret) return false

  // x-admin-key header (for server-to-server / cron calls)
  const key = request.headers.get('x-admin-key')
  if (key === secret) return true

  // httpOnly cookie sent automatically by the browser on same-origin fetches
  const cookie = request.headers.get('cookie') ?? ''
  const token  = cookie.match(/admin_token=([^;]+)/)?.[1]
  return token === secret
}

export const unauthorized = () =>
  Response.json({ error: 'Unauthorized' }, { status: 401 })
