type ProductMeta = Record<string, string>

export type { ProductMeta }

// Fetches product config from engage's own /api/product-meta.
// Returns null on any error — callers skip or warn rather than throw.
export async function fetchProductMeta(productId: string): Promise<ProductMeta | null> {
	const base = process.env.SHOULDIT_ENGAGE_URL ?? 'https://engage.shouldit.com'
	try {
		const res = await fetch(`${base}/api/product-meta?productId=${productId}`, {
			headers: { 'x-source': 'engage' },
			signal: AbortSignal.timeout(5000),
		})
		if (!res.ok) return null
		return res.json() as Promise<ProductMeta>
	} catch {
		return null
	}
}

// Replaces {{variable}} placeholders in email templates.
// ctx.sid      = subscriber ID, used in survey and unsubscribe links (?sid=...)
// ctx.category = derived from sequenceId (e.g. 'blenders_buying' → 'blenders')
// ctx.meta     = enrollment meta (e.g. quiz answers: use_case, ...)
// prefetchedMeta = product data from /api/product-meta (fetched by caller)
// Unmatched placeholders are left as-is so broken templates are visible in the email.
export function resolveVariables(
	template:      string,
	ctx:           { sid: string; category?: string; meta?: Record<string, string> },
	prefetchedMeta?: ProductMeta | null,
): string {
	const vars: Record<string, string> = {
		sid:      ctx.sid,
		category: ctx.category ?? '',
		...(ctx.meta ?? {}),
		...(prefetchedMeta ?? {}),
	}
	return template.replace(/\{\{(\w+)\}\}/g, (match, key) => vars[key] ?? match)
}
