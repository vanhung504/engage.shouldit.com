import type { SubscriberAttribute } from '@/db/schema'

type ProductMeta = {
  name:           string
  currentPrice:   string
  historicalLow:  string
  priceStatus:    string
  score:          string
  reviewUrl:      string
  affiliateUrl:   string
  valueStatement: string
  verdict:        string
  testTip:        string
}

export type { ProductMeta }

export async function fetchProductMeta(slug: string): Promise<ProductMeta | null> {
  const base = process.env.SHOULDIT_API_URL ?? 'https://shouldit.com'
  try {
    const res = await fetch(`${base}/api/product-meta?slug=${slug}`, {
      headers: { 'x-source': 'engage' },
      signal: AbortSignal.timeout(5000),
    })
    if (!res.ok) return null
    return res.json() as Promise<ProductMeta>
  } catch {
    return null
  }
}

export async function resolveVariables(
  template: string,
  subscriberTags: SubscriberAttribute[],
): Promise<string> {
  const productId = subscriberTags.find(t => t.key === 'product_id')?.value
  const useCase     = subscriberTags.find(t => t.key === 'use_case')?.value ?? ''
  const sid         = subscriberTags.find(t => t.key === 'sid')?.value ?? ''
  const category    = subscriberTags.find(t => t.key === 'category')?.value ?? ''

  let vars: Record<string, string> = { use_case: useCase, sid, category }

  if (productId) {
    const meta = await fetchProductMeta(productId)
    if (meta) {
      vars = {
        ...vars,
        product_name:    meta.name,
        current_price:   meta.currentPrice,
        low_price:       meta.historicalLow,
        price_status:    meta.priceStatus,
        score:           meta.score,
        review_url:      meta.reviewUrl,
        affiliate_url:   meta.affiliateUrl,
        value_statement: meta.valueStatement,
        product_verdict: meta.verdict,
        test_tip:        meta.testTip,
      }
    } else {
      console.warn(`[resolveVariables] product-meta fetch failed for slug: ${productId}`)
    }
  }

  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => vars[key] ?? match)
}
