const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export type WidgetMeta = {
  name:          string
  currentPrice:  string
  historicalLow: string
  priceStatus:   string
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS })
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const productSlug = searchParams.get('product')
  const bestSlug    = searchParams.get('best')

  if (!productSlug && !bestSlug) {
    return Response.json({ error: 'id or best param required' }, { status: 400, headers: CORS })
  }

  const base = process.env.SHOULDIT_API_URL ?? 'https://shouldit.com'

  try {
    if (productSlug) {
      const res = await fetch(`${base}/api/product-meta?slug=${encodeURIComponent(productSlug)}`, {
        headers: { 'x-source': 'engage' },
        signal:  AbortSignal.timeout(5000),
      })
      if (!res.ok) return Response.json({ error: 'Not found' }, { status: res.status, headers: CORS })

      const p = await res.json()
      const meta: WidgetMeta = {
        name:          p.name,
        currentPrice:  p.currentPrice,
        historicalLow: p.historicalLow,
        priceStatus:   p.priceStatus,
      }
      return Response.json(meta, { headers: CORS })
    }

    // best slug — take top pick
    const res = await fetch(`${base}/api/best-meta?slug=${encodeURIComponent(bestSlug!)}`, {
      headers: { 'x-source': 'engage' },
      signal:  AbortSignal.timeout(8000),
    })
    if (!res.ok) return Response.json({ error: 'Not found' }, { status: res.status, headers: CORS })

    const picks: { name: string; currentPrice: string; historicalLow: string; priceStatus: string }[] = await res.json()
    const top = Array.isArray(picks) ? picks[0] : picks
    if (!top) return Response.json({ error: 'No picks' }, { status: 404, headers: CORS })

    const meta: WidgetMeta = {
      name:          top.name,
      currentPrice:  top.currentPrice,
      historicalLow: top.historicalLow,
      priceStatus:   top.priceStatus,
    }
    return Response.json(meta, { headers: CORS })
  } catch {
    return Response.json({ error: 'Upstream error' }, { status: 502, headers: CORS })
  }
}
