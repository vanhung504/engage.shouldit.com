import { subscribe } from '../api'
import { isSubscribed, wasExitShown, markExitShown } from '../storage'

function buildModal(onClose: () => void): HTMLElement {
  const overlay = document.createElement('div')
  overlay.dataset.si = 'exit-overlay'
  overlay.className = 'fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]'
  overlay.innerHTML = `
    <div data-si="exit-modal" class="relative bg-white rounded-lg p-6 max-w-sm w-full mx-4 shadow-xl">
      <button data-si="exit-close" aria-label="Close" class="absolute top-3 right-4 text-gray-400 text-xl leading-none cursor-pointer border-none bg-transparent hover:text-gray-600">×</button>
      <p class="text-[18px] font-semibold m-0 mb-2">Before you go —</p>
      <p class="text-gray-700 m-0 mb-5">Get our verdict on this product, plus price history, delivered to your inbox. Free.</p>
      <div class="flex flex-col gap-2">
        <input data-si="email" class="px-3 py-2 border border-gray-300 rounded-md text-sm outline-none focus:border-gray-900" type="email" placeholder="Your email" />
        <button data-si="submit" class="px-4 py-2 bg-gray-900 text-white border-none rounded-md text-sm font-medium cursor-pointer hover:bg-gray-700">Send me the results →</button>
      </div>
      <p class="text-[12px] text-gray-400 m-0 mt-3">We buy everything we test. No ads.</p>
    </div>
  `

  const input   = overlay.querySelector<HTMLInputElement>('[data-si="email"]')!
  const button  = overlay.querySelector<HTMLButtonElement>('[data-si="submit"]')!
  const closeEl = overlay.querySelector<HTMLButtonElement>('[data-si="exit-close"]')!
  const modal   = overlay.querySelector<HTMLElement>('[data-si="exit-modal"]')!

  const close = () => { overlay.remove(); onClose() }

  closeEl.addEventListener('click', close)
  overlay.addEventListener('click', e => { if (e.target === overlay) close() })

  button.addEventListener('click', async () => {
    const email = input.value.trim()
    if (!email) return
    button.disabled = true
    button.textContent = 'Sending…'

    const result = await subscribe(email)
    if (result.success) {
      modal.innerHTML =
        '<p class="text-[18px] font-semibold m-0 mb-2">✓ Check your inbox</p><p class="text-gray-500 m-0">We\'ll send the results shortly.</p>'
      setTimeout(close, 2000)
    } else {
      button.disabled = false
      button.textContent = 'Send me the results →'
    }
  })

  return overlay
}

function show(): void {
  if (isSubscribed() || wasExitShown()) return
  markExitShown()
  document.body.appendChild(buildModal(() => {}))
}

function initDesktop(): void {
  document.addEventListener('mouseleave', e => {
    if (e.clientY <= 0) show()
  }, { once: true })
}

function initMobile(): void {
  window.addEventListener('popstate', show, { once: true })
}

export function initExitIntent(): void {
  if (isSubscribed() || wasExitShown()) return
  const isMobile = /Mobi|Android/i.test(navigator.userAgent)
  if (isMobile) initMobile()
  else initDesktop()
}
