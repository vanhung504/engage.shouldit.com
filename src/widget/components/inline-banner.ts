import { subscribe, fetchWidgetMeta, type WidgetMeta } from '../api'
import { isSubscribed } from '../storage'

const CTA: Record<string, string> = {
  buying:   'Check the price history →',
  research: 'See full scores →',
  deal:     'Alert me →',
  data:     'Unlock scores →',
}

function buildHeadline(intent: string | undefined, meta: WidgetMeta | null): string {
  if (!meta) {
    return intent === 'buying' ? 'Is this a good price right now?'
      : intent === 'deal'     ? 'Alert me if the price drops'
      : 'See how it scored vs 44 others'
  }

  if (intent === 'buying' || intent === 'deal') {
    return `Is ${meta.currentPrice} a good price for the ${meta.name} right now?`
  }
  if (intent === 'research') {
    return `See how the ${meta.name} scored vs 44 others`
  }
  return `Is ${meta.currentPrice} a good price for the ${meta.name} right now?`
}

function buildSubtitle(intent: string | undefined, meta: WidgetMeta | null): string | null {
  if (!meta) return null
  if (intent === 'buying' || intent === 'deal') {
    return `It's dropped to ${meta.historicalLow} before. We track price history — we'll tell you if now is a good time to buy, or if you should wait.`
  }
  return null
}

function renderBanner(headline: string, subtitle: string | null, cta: string): Element {
  const banner = document.createElement('div')
  banner.className = 'font-sans text-sm text-gray-900 bg-[#eef1f8] border border-[#d0d7e8] rounded-lg p-4 my-4 max-w-xl'

  const subtitleHtml = subtitle
    ? `<p class="text-[13px] text-gray-500 m-0 mb-3">${subtitle}</p>`
    : ''

  banner.innerHTML = `
    <p class="text-[15px] font-semibold m-0 mb-1">${headline}</p>
    ${subtitleHtml}
    <div class="flex gap-2 flex-wrap items-center">
      <span class="text-lg">💰</span>
      <input data-si="email" class="flex-1 min-w-50 px-3 py-2 border border-gray-300 rounded-md text-sm outline-none focus:border-gray-900 bg-white" type="email" placeholder="your@email.com" aria-label="Email address" />
      <button data-si="submit" class="px-4 py-2 bg-[#1e2d5a] text-white border-none rounded-md text-sm font-medium cursor-pointer whitespace-nowrap hover:bg-[#2a3d7a]">${cta}</button>
    </div>
    <p class="text-[11px] text-gray-400 m-0 mt-2">One email. No spam. We tell you if it's worth buying now or not.</p>
  `

  const input  = banner.querySelector<HTMLInputElement>('[data-si="email"]')!
  const button = banner.querySelector<HTMLButtonElement>('[data-si="submit"]')!

  button.addEventListener('click', async () => {
    const email = input.value.trim()
    if (!email) return
    button.disabled = true
    button.textContent = 'Sending…'

    const result = await subscribe(email)

    if (result.success) {
      banner.innerHTML = '<p class="text-emerald-600 font-medium m-0">✓ You\'re in. Check your inbox.</p>'
    } else {
      button.disabled = false
      button.textContent = cta
      input.setCustomValidity(result.error)
      input.reportValidity()
    }
  })

  return banner
}

export async function mountInlineBanner(anchor: Element): Promise<void> {
  if (isSubscribed()) return

  const intent = window.ShouldItEmail?.intent
  const cta    = CTA[intent ?? ''] ?? CTA.research

  // Placeholder giữ chỗ trong khi fetch
  const placeholder = document.createElement('div')
  placeholder.className = 'h-24'
  anchor.replaceWith(placeholder)

  const meta     = await fetchWidgetMeta()
  const headline = buildHeadline(intent, meta)
  const subtitle = buildSubtitle(intent, meta)
  const banner   = renderBanner(headline, subtitle, cta)

  placeholder.replaceWith(banner)
}

export function mountAllInlineBanners(): void {
  document.querySelectorAll('[data-si-inline]').forEach(el => mountInlineBanner(el))
}
