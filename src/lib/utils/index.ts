interface Retail {
	key: string;
	name: string;
	link: string;
	pLink: string;
	price: number | null;
}

interface ApiVariantEntry {
	retails: Retail[];
	ordered: boolean;
}

export interface PriceEntry {
	variants: Record<string, ApiVariantEntry>;
}
export type PricesResponse = Record<string, PriceEntry>;
export type BuyUrlEntry = string | { link: string; price: number | null };
export type BuyUrlMap = Record<string, BuyUrlEntry>;


export interface CheapestBuyUrl {
	link: string;
	retailer: string;
	price?: number;
	color?: string;
}

export function getCheapestBuyUrl(buyUrls: BuyUrlMap | null | undefined): CheapestBuyUrl | null {
	if (!buyUrls) return null;
	let best: { link: string; retailer: string; price: number } | null = null;
	let fallback: { link: string; retailer: string } | null = null;
	for (const [retailer, entry] of Object.entries(buyUrls)) {
		if (typeof entry === "string") {
			if (!fallback) fallback = { link: entry, retailer };
			continue;
		}
		if (entry.price != null && entry.price > 0) {
			if (!best || entry.price < best.price) {
				best = { link: entry.link, retailer, price: entry.price };
			}
		} else if (!fallback) {
			fallback = { link: entry.link, retailer };
		}
	}
	return best ?? fallback;
}

type VariantLike = {
	sku?: string;
	reviewed?: boolean;
	features?: unknown;
	includes?: unknown;
	buyUrls?: Record<string, BuyUrlEntry>;
	[key: string]: unknown;
};

/** Returns cheapest buy URL from variants in the same line as the reviewed variant.
 *  Falls back to the reviewed variant's link if no priced entry found. */
export function getCheapestSameLineUrl(
	variants: VariantLike[] | undefined,
): CheapestBuyUrl | null {
	if (!variants?.length) return null;

	const sortedArr = (a: unknown) => JSON.stringify([...((a as string[] | undefined) ?? [])].sort());
	const reviewed = variants.find((v) => v.reviewed);
	if (!reviewed) return null;

	const baseFeatures = sortedArr(reviewed.features);
	const baseIncludes = sortedArr(reviewed.includes);
	const sameLine = variants.filter(
		(v) => sortedArr(v.features) === baseFeatures && sortedArr(v.includes) === baseIncludes,
	);

	let best: { link: string; retailer: string; price: number; color?: string } | null = null;
	const fallback: CheapestBuyUrl | null = getCheapestBuyUrl(reviewed.buyUrls ?? null);

	for (const v of sameLine) {
		if (!v.buyUrls) continue;
		const color = v.color as string | undefined;
		for (const [retailer, entry] of Object.entries(v.buyUrls)) {
			if (typeof entry === "string") continue;
			if (entry.price != null && entry.price > 0) {
				if (!best || entry.price < best.price) {
					best = { link: entry.link, retailer, price: entry.price, color };
				}
			}
		}
	}

	return best ?? fallback;
}

export function normalizeCategory(category: string): string {
	return category.toLowerCase().replace(/\s+/g, "-");
}

/** Returns discount percent, 0 if no meaningful drop */
export function discountPercent(current: number, original: number): number {
	if (!original || original <= current) return 0;
	return Math.round((1 - current / original) * 100);
}

const PRICES_API = "https://products.shouldit.com/api/v2/prices/";
export async function fetchPrices(productIds: string[]): Promise<PricesResponse> {
	const res = await fetch(PRICES_API, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${process.env.PRICES_API_SECRET}`,
		},
		body: JSON.stringify({ ids: productIds, includeVariants: true }),
	});
	if (!res.ok) {
		throw new Error(`Prices API returned ${res.status}: ${await res.text()}`);
	}
	return res.json() as Promise<PricesResponse>;
}