import { subscribe, fetchWidgetMeta } from '../api'
import type { WidgetMeta, ProductMeta, PlacementMeta } from '../types'
import { getEmail, isTracked, addTracked } from '../storage'

type LayoutFn<T extends WidgetMeta = WidgetMeta> = (meta: T, email: string | null) => Element

// ─── Shared snippets ──────────────────────────────────────────────────────────

const WRAP  = 'font-family:ui-sans-serif,system-ui,sans-serif;font-size:14px;color:#111827;box-sizing:border-box'
const ROW   = 'display:flex;gap:8px;flex-wrap:wrap'
const INPUT = (email: string | null, cls: string) =>
  `<input data-si="email" class="${cls}"
    style="flex:1;min-width:180px;padding:8px 12px;border:1px solid #d1d5db;border-radius:6px;font-size:14px;background:white;font-family:inherit;color:#111827"
    type="email" placeholder="your@email.com"
    value="${email ?? ''}"
    aria-label="Email address" />`

// ─── Product layouts ──────────────────────────────────────────────────────────

const PRODUCT_LAYOUTS: Record<string, Record<string, LayoutFn<ProductMeta>>> = {
  buying: {
    default: (meta, email) => {
      const el = document.createElement('div')
      el.setAttribute('style', `${WRAP};background:#eef1f8;border:1px solid #d0d7e8;border-radius:8px;padding:16px;margin:16px 0`)
      el.innerHTML = `
        <div style="display:flex;gap:12px;align-items:center">
          <span style="font-size:24px;flex-shrink:0;line-height:1">💰</span>
          <div style="flex:1;min-width:0">
            <p style="font-size:15px;font-weight:600;margin:0 0 4px">Is ${meta.currentPrice} a good price for the ${meta.name} right now?</p>
            <p style="font-size:13px;color:#6b7280;margin:0 0 12px">It's dropped to ${meta.historicalLow} before. We track price history — we'll tell you if now is a good time to buy, or if you should wait.</p>
            <div style="${ROW}">
              ${INPUT(email, 'si-input')}
              <button data-si="submit" class="si-btn" style="padding:8px 16px;background:#1e2d5a;color:white;border:none;border-radius:6px;font-size:14px;font-weight:500;cursor:pointer;white-space:nowrap;font-family:inherit">${email ? 'Track this too →' : 'Check the price history →'}</button>
            </div>
            <p style="font-size:11px;color:#9ca3af;margin:8px 0 0">No spam. No ads. We tell you if it's worth buying now or not.</p>
          </div>
        </div>
      `
      return el
    },
  },
  deal: {
    default: (meta, email) => {
      const el = document.createElement('div')
      el.setAttribute('style', `${WRAP};background:#eef1f8;border:1px solid #d0d7e8;border-radius:8px;padding:16px;margin:16px 0`)
      el.innerHTML = `
        <div style="display:flex;gap:12px;align-items:center">
          <span style="font-size:24px;flex-shrink:0;line-height:1">🔔</span>
          <div style="flex:1;min-width:0">
            <p style="font-size:15px;font-weight:600;margin:0 0 4px">Is ${meta.currentPrice} a good price for the ${meta.name} right now?</p>
            <p style="font-size:13px;color:#6b7280;margin:0 0 12px">It's dropped to ${meta.historicalLow} before. Alert me when it drops again.</p>
            <div style="${ROW}">
              ${INPUT(email, 'si-input')}
              <button data-si="submit" class="si-btn" style="padding:8px 16px;background:#1e2d5a;color:white;border:none;border-radius:6px;font-size:14px;font-weight:500;cursor:pointer;white-space:nowrap;font-family:inherit">${email ? 'Track this too →' : 'Alert me →'}</button>
            </div>
            <p style="font-size:11px;color:#9ca3af;margin:8px 0 0">One email. No spam. We alert you when the price drops.</p>
          </div>
        </div>
      `
      return el
    },
  },
  research: {
    default: (meta, email) => {
      const el = document.createElement('div')
      el.setAttribute('style', `${WRAP};background:#faf9f7;border:1px solid #e5e7eb;border-radius:12px;padding:24px;margin:16px 0;max-width:36rem`)
      el.innerHTML = `
        <p style="font-size:16px;font-weight:700;text-align:center;margin:0 0 4px">See how the ${meta.name} scored vs 44 others</p>
        <p style="font-size:13px;color:#6b7280;text-align:center;margin:0 0 16px">Full test scores across every metric — free, no account needed.</p>
        <div style="display:flex;gap:8px;align-items:center">
          ${INPUT(email, 'si-input-light')}
          <button data-si="submit" class="si-btn" style="padding:8px 16px;background:#111827;color:white;border:none;border-radius:6px;font-size:14px;font-weight:500;cursor:pointer;white-space:nowrap;font-family:inherit">${email ? 'Track this too →' : 'See full scores →'}</button>
        </div>
      `
      return el
    },
  },
}

// ─── Placement layouts ────────────────────────────────────────────────────────

const PLACEMENT_LAYOUTS: Record<string, Record<string, LayoutFn<PlacementMeta>>> = {
  quiz: {
    default: (_meta, email) => {
      const el = document.createElement('div')
      el.setAttribute('style', `${WRAP};background:#faf9f7;border:1px solid #e5e7eb;border-radius:12px;padding:24px;margin:16px 0;max-width:36rem`)
      el.innerHTML = `
        <p style="font-size:16px;font-weight:700;text-align:center;margin:0 0 4px">Not sure which one to buy?</p>
        <p style="font-size:13px;color:#6b7280;text-align:center;margin:0 0 16px">Take our 2-minute quiz and we'll tell you exactly which one fits your needs.</p>
        <div style="display:flex;gap:8px;align-items:center">
          ${INPUT(email, 'si-input-light')}
          <button data-si="submit" class="si-btn" style="padding:8px 16px;background:#111827;color:white;border:none;border-radius:6px;font-size:14px;font-weight:500;cursor:pointer;white-space:nowrap;font-family:inherit">${email ? 'Track this too →' : 'Take the quiz →'}</button>
        </div>
      `
      return el
    },
  },
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function trackedKey(meta: WidgetMeta): string {
  if (meta.type === 'product') {
    return (meta.intent === 'buying' || meta.intent === 'deal')
      ? `${meta.productId}:${meta.intent}`
      : `${meta.category}:${meta.intent}`
  }
  return `${meta.category}:${meta.intent}`
}

function getLayout(meta: WidgetMeta, email: string | null): Element | null {
  if (meta.type === 'product') {
    const layouts = PRODUCT_LAYOUTS[meta.intent]
    return (layouts?.[meta.layout] ?? layouts?.['default'])?.(meta, email) ?? null
  }
  const layouts = PLACEMENT_LAYOUTS[meta.intent]
  return (layouts?.[meta.layout] ?? layouts?.['default'])?.(meta, email) ?? null
}

function renderBanner(meta: WidgetMeta): Element {
  const key    = trackedKey(meta)
  const email  = getEmail()
  const banner = getLayout(meta, email)

  if (!banner) return document.createElement('div')

  const input  = banner.querySelector<HTMLInputElement>('[data-si="email"]')!
  const button = banner.querySelector<HTMLButtonElement>('[data-si="submit"]')!
  const cta    = button.textContent ?? ''

  const productId    = meta.type === 'product' ? meta.productId    : ''
  const currentPrice = meta.type === 'product' ? meta.currentPrice : undefined

  button.addEventListener('click', async () => {
    const emailVal = input.value.trim()
    if (!emailVal) return
    button.disabled = true
    button.textContent = 'Sending…'

    const result = await subscribe(emailVal, productId, meta.category, meta.intent, currentPrice)

    if (result.success) {
      addTracked(key)
      banner.innerHTML = '<p style="font-family:ui-sans-serif,system-ui,sans-serif;color:#059669;font-weight:500;margin:0">✓ You\'re in. Check your inbox.</p>'
    } else {
      button.disabled = false
      button.textContent = cta
      input.setCustomValidity(result.error)
      input.reportValidity()
    }
  })

  return banner
}

// ─── Mount ────────────────────────────────────────────────────────────────────

export async function mountAllInlineBanners(): Promise<void> {
  const anchors = Array.from(document.querySelectorAll<HTMLElement>('[data-si-inline]'))
  if (!anchors.length) return

  const metas = await fetchWidgetMeta()
  const metaMap = new Map(metas.map(m => [
    m.type === 'product' ? m.productId : `${m.category}:${m.intent}`,
    m,
  ]))

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return
      observer.unobserve(entry.target)

      const anchor = entry.target as HTMLElement
      const key    = anchor.dataset.siInline ?? ''
      const meta   = metaMap.get(key) ?? null

      if (meta && !isTracked(trackedKey(meta))) {
        anchor.replaceWith(renderBanner(meta))
      }
    })
  }, { rootMargin: '600px' })

  anchors.forEach(anchor => observer.observe(anchor))
}
