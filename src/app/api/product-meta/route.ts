import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { products } from '@/db/schema'
import { fetchPriceStats } from '@/lib/utils'

const CORS = {
	'Access-Control-Allow-Origin':  '*',
	'Access-Control-Allow-Methods': 'GET, OPTIONS',
	'Access-Control-Allow-Headers': 'Content-Type',
}

export async function OPTIONS() {
	return new Response(null, { status: 204, headers: CORS })
}

export async function GET(request: Request) {
	const productId = new URL(request.url).searchParams.get('productId')
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

	const priceStats = await fetchPriceStats([product.productId], true).catch(() => null)
	const stats = priceStats?.[product.productId]

	// Flatten meta: string values pass through,
	// object values (e.g. value_statement per price_status) serialised as JSON —
	// send-step resolves the right variant at send time based on price_status.
	const flat: Record<string, string> = { product_name: product.name }
	for (const { key, value } of product.meta) {
		if (typeof value === 'string') {
			flat[key] = value
		} else {
			const resolved = stats ? value[stats.priceStatus] : undefined
			if (resolved !== undefined) flat[key] = resolved
		}
	}
	console.log(stats)
	if (stats) {
		flat.current_price     	= stats.currentPrice
		flat.low_price  		= stats.historicalLow
		flat.high_price 		= stats.historicalHigh
		flat.price_status      	= stats.priceStatus
		if (stats.priceDiffFromLow) flat.price_diff_from_low = stats.priceDiffFromLow
		if (stats.targetPriceRange) flat.target_price_range  = stats.targetPriceRange
	}

	return Response.json(flat, { headers: CORS })
}
