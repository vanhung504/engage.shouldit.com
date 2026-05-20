import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { products } from '@/db/schema'
import { fetchPriceStats, parsePrice, getPricePositionText, priceGaugeHtml } from '@/lib/utils'
import type { PriceStatus } from '@/lib/utils'

const CORS = {
	'Access-Control-Allow-Origin':  '*',
	'Access-Control-Allow-Methods': 'GET, OPTIONS',
	'Access-Control-Allow-Headers': 'Content-Type',
}

export async function OPTIONS() {
	return new Response(null, { status: 204, headers: CORS })
}

const VALID_STATUSES = new Set<PriceStatus>(['all-time-low', 'good', 'fair', 'high'])

export async function GET(request: Request) {
	const { searchParams } = new URL(request.url)
	const productId    = searchParams.get('productId')
	const forceStatus  = searchParams.get('force_status') as PriceStatus | null
	if (!productId) {
		return Response.json({ error: 'productId required' }, { status: 400, headers: CORS })
	}

	const [product] = await db
		.select()
		.from(products)
		.where(eq(products.productId, productId))
		.limit(1)

	if (!product) {
		return Response.json({ error: 'Not found' }, { status: 404, headers: CORS })
	}

	// force_status=good|fair|high|all-time-low: admin preview only — fakes current price inside
	// fetchPriceStats so all derived values (priceDiffFromLow, targetPriceRange, etc.) are consistent.
	const validatedStatus = forceStatus && VALID_STATUSES.has(forceStatus) ? forceStatus : undefined
	const priceStats = await fetchPriceStats([product.productId], true, validatedStatus).catch(() => null)
	const stats = priceStats?.[product.productId] ?? null

	const flat: Record<string, string> = { product_name: product.name }
	for (const { key, value } of product.meta) {
		if (typeof value === 'string') {
			flat[key] = value
		} else {
			const resolved = stats ? value[stats.priceStatus] : undefined
			if (resolved !== undefined) flat[key] = resolved
		}
	}

	if (stats) {
		flat.current_price = stats.currentPrice
		flat.low_price     = stats.historicalLow
		flat.high_price    = stats.historicalHigh
		flat.price_status  = stats.priceStatus

		if (stats.affiliateUrl)     flat.affiliate_url       = stats.affiliateUrl
		if (stats.priceDiffFromLow) flat.price_diff_from_low = stats.priceDiffFromLow
		if (stats.targetPriceRange) flat.target_price_range  = stats.targetPriceRange

		const cur = parsePrice(stats.currentPrice), lo = parsePrice(stats.historicalLow), hi = parsePrice(stats.historicalHigh)
		if (hi > lo) {
			flat.price_gauge_html = priceGaugeHtml(stats.currentPrice, stats.historicalLow, stats.historicalHigh)
		}
		if (stats.priceStatus === 'fair') flat.price_position_text = getPricePositionText(cur, lo, hi)
	}

	return Response.json(flat, { headers: CORS })
}
