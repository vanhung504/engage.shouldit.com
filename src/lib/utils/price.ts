// ─── Types ────────────────────────────────────────────────────────────────────

export type PriceStatus        = 'all-time-low' | 'good' | 'fair' | 'high'
export type PriceStatsResponse = Record<string, PriceStat>
export type PricesResponse     = Record<string, PriceEntry>
export type BuyUrlEntry        = string | { link: string; price: number | null }
export type BuyUrlMap          = Record<string, BuyUrlEntry>

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface PriceStat {
	currentPrice:      string
	historicalLow:     string
	historicalHigh:    string
	priceStatus:       PriceStatus
	priceDiffFromLow?: string
	targetPriceRange?: string
}

export interface CheapestBuyUrl {
	link:      string
	retailer:  string
	price?:    number
	color?:    string
}

interface Retail {
	key: string
	name: string
	link: string
	pLink: string
	price: number | null
}

interface ApiVariantEntry {
	retails: Retail[]
	ordered: boolean
}

interface PriceEntry {
	variants: Record<string, ApiVariantEntry>
}

// ─── Config ───────────────────────────────────────────────────────────────────

export const PRICE_STATUS_THRESHOLDS = {
	allTimeLowMargin: 1.03,
	goodRangePct:     0.30,
	fairRangePct:     0.70,
}

const PRICES_API      = 'https://products.shouldit.com/api/v2/prices/'
const PRICE_STATS_API = 'https://products.shouldit.com/api/v2/price-stats/'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parsePrice(s: string): number {
	return parseFloat(s.replace(/[^0-9.]/g, ''))
}

function calcPriceExtras(currentPrice: string, historicalLow: string, historicalHigh: string) {
	const current = parsePrice(currentPrice)
	const low     = parsePrice(historicalLow)
	const high    = parsePrice(historicalHigh)
	const range   = high - low
	const { goodRangePct } = PRICE_STATUS_THRESHOLDS
	return {
		priceDiffFromLow: `$${Math.round(current - low)}`,
		targetPriceRange: `$${Math.round(low)}–$${Math.round(low + range * goodRangePct)}`,
	}
}

function calcPriceStatus(currentPrice: string, historicalLow: string, historicalHigh: string): PriceStatus {
	const current = parsePrice(currentPrice)
	const low     = parsePrice(historicalLow)
	const high    = parsePrice(historicalHigh)
	const range   = high - low
	const { allTimeLowMargin, goodRangePct, fairRangePct } = PRICE_STATUS_THRESHOLDS
	if (current <= low * allTimeLowMargin)     return 'all-time-low'
	if (current <= low + range * goodRangePct) return 'good'
	if (current <= low + range * fairRangePct) return 'fair'
	return 'high'
}

export function cheapestRetail(entry: PriceEntry): Retail | null {
	let best: Retail | null = null
	for (const variant of Object.values(entry.variants)) {
		for (const retail of variant.retails) {
			if (retail.price != null && retail.price > 0) {
				if (!best || retail.price < best.price!) best = retail
			}
		}
	}
	return best
}

/** Returns discount percent, 0 if no meaningful drop */
export function discountPercent(current: number, original: number): number {
	if (!original || original <= current) return 0
	return Math.round((1 - current / original) * 100)
}

// ─── API ──────────────────────────────────────────────────────────────────────

export async function fetchPriceStats(productIds: string[], extras = false): Promise<PriceStatsResponse> {
	const res = await fetch(PRICE_STATS_API, {
		method:  'POST',
		headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.PRICES_API_SECRET}` },
		body:    JSON.stringify({ ids: productIds }),
	})
	if (!res.ok) throw new Error(`Price-stats API returned ${res.status}: ${await res.text()}`)
	const raw: Record<string, Omit<PriceStat, 'priceStatus'>> = await res.json()
	return Object.fromEntries(
		Object.entries(raw).map(([id, s]) => [id, {
			...s,
			priceStatus: calcPriceStatus(s.currentPrice, s.historicalLow, s.historicalHigh),
			...(extras ? calcPriceExtras(s.currentPrice, s.historicalLow, s.historicalHigh) : {}),
		}])
	)
}

export async function fetchPrices(productIds: string[]): Promise<PricesResponse> {
	const res = await fetch(PRICES_API, {
		method:  'POST',
		headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.PRICES_API_SECRET}` },
		body:    JSON.stringify({ ids: productIds }),
	})
	if (!res.ok) throw new Error(`Prices API returned ${res.status}: ${await res.text()}`)
	return res.json() as Promise<PricesResponse>
}
