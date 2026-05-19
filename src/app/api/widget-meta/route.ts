import { fetchPriceStats } from '@/lib/utils'
import type { ProductMeta, PlacementMeta, WidgetMeta } from '@/widget/types'

export type { WidgetMeta } from '@/widget/types'

const CORS = {
	'Access-Control-Allow-Origin':  '*',
	'Access-Control-Allow-Methods': 'GET, OPTIONS',
	'Access-Control-Allow-Headers': 'Content-Type',
}

// ─── Config ───────────────────────────────────────────────────────────────────

type ProductPlacement  = { id: string; intent: string; layout?: string }
type CategoryPlacement = { intent: string; layout?: string }
type PageConfig = {
	products:   ProductPlacement[]
	placements: CategoryPlacement[]
}
type ProductConfig  = { name: string }
type CategoryConfig = {
	pages:    Record<string, PageConfig>
	products: Record<string, ProductConfig>
}

const widgetConfig: Record<string, CategoryConfig> = {
	'kitchen-faucets': {
		pages: {
			'reviews/best': {
				products: [
					{ id: '6503b706-5898-4895-b9f6-b15fa304dcc7', intent: 'buying' },
				],
				placements: [],
			},
		},
		products: {
			'6503b706-5898-4895-b9f6-b15fa304dcc7': { name: 'Delta Lenta Touch2O' },
		},
	},
	'blenders': {
		pages: {
			'reviews/best': {
				products: [
					{ id: '219f6797-3c82-4a00-b973-8e5ad3eb9325', intent: 'buying' },
				],
				placements: [],
			},
		},
		products: {
			'219f6797-3c82-4a00-b973-8e5ad3eb9325': { name: 'NutriBullet Full-Size' },
		},
	},
}

// ─── Route ────────────────────────────────────────────────────────────────────

export async function OPTIONS() {
	return new Response(null, { status: 204, headers: CORS })
}

export async function GET(request: Request) {
	const bestSlug = new URL(request.url).searchParams.get('best')
	if (!bestSlug) {
		return Response.json({ error: 'best param required' }, { status: 400, headers: CORS })
	}

	const [category, ...parts] = bestSlug.replace(/^\/|\/$/g, '').split('/')
	const path = parts.join('/')

	const config = widgetConfig[category]
	const page   = config?.pages[path]

	if (!page) {
		return Response.json({ error: 'No config for this slug' }, { status: 404, headers: CORS })
	}

	try {
		const productIds = page.products.map(p => p.id)
		const stats      = productIds.length ? await fetchPriceStats(productIds) : {}

		const productResults: ProductMeta[] = page.products
			.filter(p => stats[p.id])
			.map(p => ({
				type:          'product',
				productId:     p.id,
				name:          config.products[p.id]?.name ?? p.id,
				category,
				intent:        p.intent,
				layout:        p.layout ?? 'default',
				currentPrice:  stats[p.id].currentPrice,
				historicalLow: stats[p.id].historicalLow,
				priceStatus:   stats[p.id].priceStatus,
			}))

		const placementResults: PlacementMeta[] = page.placements.map(pl => ({
			type:     'placement',
			category,
			intent:   pl.intent,
			layout:   pl.layout ?? 'default',
		}))

		const results: WidgetMeta[] = [...productResults, ...placementResults]

		if (!results.length) {
			return Response.json({ error: 'No data available' }, { status: 404, headers: CORS })
		}

		return Response.json(results, { headers: CORS })

	} catch (err) {
		console.error('[widget-meta] error:', err)
		return Response.json({ error: 'Prices API error' }, { status: 502, headers: CORS })
	}
}
