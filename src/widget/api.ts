import { saveSubscriber } from './storage'

import type { WidgetMeta } from './types'

const API_URL: string = (
  (document.currentScript as HTMLScriptElement | null)?.dataset.api
  ?? document.querySelector<HTMLScriptElement>('script[data-api]')?.dataset.api
  ?? 'https://engage.shouldit.com/api'
)

function getApiUrl(): string { return API_URL }

type SubscribeResult =
  | { success: true;  isNew: boolean }
  | { success: false; error: string }

export async function subscribe(
  email:         string,
  productId?:    string,
  category?:     string,
  intent?:       string,
  currentPrice?: string,
): Promise<SubscribeResult> {
  const res = await fetch(`${getApiUrl()}/subscribe`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email,
      attributes: { product_id: productId, category, intent, current_price: currentPrice },
    }),
  })

  const data: SubscribeResult = await res.json()
  if (data.success) saveSubscriber(email, '')
  return data
}

export async function fetchWidgetMeta(): Promise<WidgetMeta[]> {
  const base = getApiUrl()
  const slug = window.location.pathname.replace(/^\/|\/$/g, '')
  if (!slug) return []

  try {
    const res = await fetch(`${base}/widget-meta?best=${encodeURIComponent(slug)}`, {
      signal: AbortSignal.timeout(4000),
    })
    if (!res.ok) return []
    return res.json()
  } catch {
    return []
  }
}

export async function trackClick(productId: string): Promise<void> {
  fetch(`${getApiUrl()}/track-click`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email:     localStorage.getItem('si_email'),
      productId,
      pageUrl:   location.href,
    }),
  }).catch(() => {})
}
