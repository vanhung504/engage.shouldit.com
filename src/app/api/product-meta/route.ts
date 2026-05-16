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
    const res = await fetch(`${base}/api/product-meta?slug=${encodeURIComponent(slug)}`, {
      headers: { 'x-source': 'engage' },
      signal:  AbortSignal.timeout(5000),
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


const metas = {
	'blenders': {
		"product_id": {
			"product_name": "NutriBullet Full-Size",
			"url": "https://shouldit.com/reviews/nutribullet-znbf30500z-blender-combo-1200-watt-review",
			"score": "8.6",
			
			"product_verdict": "Smoothies, frozen fruit, protein shakes, crushed ice: strong across the board. The one miss: nut butter — takes longer and finishes rougher than faster rivals. If that's not your main use, it won't matter.",
			"value_statement": "The one we'd put in our own kitchen.",

			"current_price": "$94",
			"low_price": "$89",
			"high_price": "$134",
			"price_status": "good",
			"affiliate_url": "https://shouldit.com/buy/213-nutribullet-znbf30500z-blender-combo-1200-watt/?merchant=amazon",
			"chart_url": "https://cdn.shouldit.com/charts/nutribullet-znbf30500z-12m-94.png",
			"price_diff_from_low": "$5",
			"price_diff_pct_from_low": "6%",
			"sale_months": "Prime Day (July) and Black Friday (November)",
			
		}
	}
}