import { saveSubscriber } from './storage'

export type WidgetMeta = {
  name:          string
  currentPrice:  string
  historicalLow: string
  priceStatus:   string
}

declare global {
  interface Window {
    ShouldItEmail: {
      apiUrl:      string
      category?:   string
      intent?:     string
      productId?:  string
      productName?: string
      entryPoint?: string
    }
  }
}

function getApiUrl(): string {
  return window.ShouldItEmail?.apiUrl ?? 'https://engage.shouldit.com/api'
}

type SubscribeResult =
  | { success: true;  isNew: boolean }
  | { success: false; error: string }

export async function subscribe(email: string): Promise<SubscribeResult> {
  const cfg = window.ShouldItEmail ?? {}

  const res = await fetch(`${getApiUrl()}/subscribe`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email,
      attributes: {
        category:    cfg.category,
        intent:      cfg.intent,
        product_id:  cfg.productId,
        entry_point: cfg.entryPoint,
      },
    }),
  })

  const data: SubscribeResult = await res.json()

  if (data.success) {
    // subscriberId comes back via a separate header or we derive it later via storage
    saveSubscriber(email, '')
  }

  return data
}

export async function fetchWidgetMeta(): Promise<WidgetMeta | null> {
  const cfg = window.ShouldItEmail ?? {}
  const base = getApiUrl()

  const param = cfg.productId
    ? `product=${encodeURIComponent(cfg.productId)}`
    : cfg.category
      ? `best=${encodeURIComponent(cfg.category)}`
      : null

  if (!param) return null

  try {
    const res = await fetch(`${base}/widget-meta?${param}`, {
      signal: AbortSignal.timeout(4000),
    })
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

export async function trackClick(productId: string): Promise<void> {
  const cfg = window.ShouldItEmail ?? {}

  fetch(`${getApiUrl()}/track-click`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email:     localStorage.getItem('si_email'),
      productId,
      category:  cfg.category ?? '',
      pageUrl:   location.href,
    }),
  }).catch(() => {})
}
