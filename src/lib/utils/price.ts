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
	affiliateUrl?:     string
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
	fairRangePct:     0.60,
}

const PRICES_API      = 'https://products.shouldit.com/api/v2/prices/'
const PRICE_STATS_API = 'https://products.shouldit.com/api/v2/price-stats/'

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function parsePrice(s: string): number {
	return parseFloat(s.replace(/[^0-9.]/g, ''))
}

export function fakePriceForStatus(status: PriceStatus, historicalLow: string, historicalHigh: string): string {
	const low   = parsePrice(historicalLow)
	const high  = parsePrice(historicalHigh)
	const range = high - low
	const { allTimeLowMargin, goodRangePct, fairRangePct } = PRICE_STATUS_THRESHOLDS
	const rand  = (min: number, max: number) => min + Math.random() * (max - min)

	let price: number
	if (status === 'all-time-low') price = rand(low, low * allTimeLowMargin)
	else if (status === 'good')    price = rand(low * allTimeLowMargin, low + range * goodRangePct)
	else if (status === 'fair')    price = rand(low + range * goodRangePct, low + range * fairRangePct)
	else                           price = rand(low + range * fairRangePct, high)

	return `$${price.toFixed(2)}`
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

export function priceGaugeHtml(currentPrice: string, historicalLow: string, historicalHigh: string): string {
	const cur       = parsePrice(currentPrice)
	const lo        = parsePrice(historicalLow)
	const hi        = parsePrice(historicalHigh)
	const pct       = hi > lo ? Math.min(100, Math.max(0, Math.round((cur - lo) / (hi - lo) * 100))) : 50
	const needlePct = Math.min(99, Math.max(1, pct))

	return `<div style="padding-top:10px;margin-bottom:6px;">
        <div style="display: flex;">
        	<div style="width: ${needlePct < 5 ? 0: needlePct - 4}%;"></div>
    		<div style="font-size:12px;font-weight:600;color:#111;white-space:nowrap;line-height:1;">${currentPrice}</div>
        </div>
		<div style="display: flex;">
        	<div style="width: ${needlePct}%;"></div>
        	<div style="width:1.5px;height:14px;background:#111;margin:3px 0 1px;"></div>
        </div>
        <div style="clear: both; height:10px;border-radius:5px;display:flex;overflow:hidden;">
          <div style="width:30%;background:#4a9e5c;"></div>
          <div style="width:30%;background:#d4870f;"></div>
          <div style="width:40%;background:#c94a48;"></div>
        </div>
      </div>
      <div style="display:flex;font-size:11px;color:#aaa;margin-bottom:4px;">
        <span style="width:50%;">${historicalLow}</span>
        <span style="width:50%; text-align:right;">${historicalHigh}</span>
      </div>
      <div style="display:flex;font-size:11px;">
        <div style="width:30%;color:#4a9e5c;">Good</div>
        <div style="width:30%;color:#d4870f;text-align:center;">Fair</div>
        <div style="width:40%;color:#c94a48;text-align:right;">High</div>
      </div>`
}

export function getPricePositionText(currentPrice: number, low: number, high: number): string {
	const range     = high - low
	const goodEnd   = low + range * PRICE_STATUS_THRESHOLDS.goodRangePct
	const fairEnd   = low + range * PRICE_STATUS_THRESHOLDS.fairRangePct
	const posInFair = (currentPrice - goodEnd) / (fairEnd - goodEnd)

	if (posInFair < 0.33) return 'near the lower end of its fair range'
	if (posInFair < 0.66) return 'in the middle of its fair range'
	return 'in the upper end of its fair range'
}

/** Returns discount percent, 0 if no meaningful drop */
export function discountPercent(current: number, original: number): number {
	if (!original || original <= current) return 0
	return Math.round((1 - current / original) * 100)
}

// ─── API ──────────────────────────────────────────────────────────────────────

export async function fetchPriceStats(
	productIds:  string[],
	extras       = false,
	forceStatus?: PriceStatus,
): Promise<PriceStatsResponse> {
	const res = await fetch(PRICE_STATS_API, {
		method:  'POST',
		headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.PRICES_API_SECRET}` },
		body:    JSON.stringify({ ids: productIds }),
	})
	if (!res.ok) throw new Error(`Price-stats API returned ${res.status}: ${await res.text()}`)
	const raw: Record<string, Omit<PriceStat, 'priceStatus'>> = await res.json()
	return Object.fromEntries(
		Object.entries(raw).map(([id, s]) => {
			const currentPrice = forceStatus
				? fakePriceForStatus(forceStatus, s.historicalLow, s.historicalHigh)
				: s.currentPrice
			const priceStatus = forceStatus ?? calcPriceStatus(currentPrice, s.historicalLow, s.historicalHigh)
			return [id, {
				...s,
				currentPrice,
				priceStatus,
				...(extras ? calcPriceExtras(currentPrice, s.historicalLow, s.historicalHigh) : {}),
			}]
		})
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
