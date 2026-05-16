const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS })
}

export async function GET(request: Request) {
  const slug = new URL(request.url).searchParams.get('slug')
  if (!slug) {
    return Response.json({ error: 'slug required' }, { status: 400, headers: CORS })
  }

  const base = process.env.SHOULDIT_API_URL ?? 'https://shouldit.com'
  try {
    const res = await fetch(`${base}/api/best-meta?slug=${encodeURIComponent(slug)}`, {
      headers: { 'x-source': 'engage' },
      signal:  AbortSignal.timeout(8000),
    })
    if (!res.ok) {
      return Response.json({ error: 'Not found' }, { status: res.status, headers: CORS })
    }
    const data = await res.json()
    return Response.json(data, { headers: CORS })
  } catch {
    return Response.json({ error: 'Upstream error' }, { status: 502, headers: CORS })
  }
}
