import { subscribe } from '../api'
import { isSubscribed, isGateUnlocked, unlockGate } from '../storage'

function unlock(gate: HTMLElement, gateId: string): void {
  unlockGate(gateId)
  gate.querySelector<HTMLElement>('[data-si="blur"]')?.classList.remove('blur-sm', 'select-none', 'pointer-events-none')
  gate.querySelector('[data-si="overlay"]')?.remove()
}

function buildOverlay(gate: HTMLElement, gateId: string): HTMLElement {
  const overlay = document.createElement('div')
  overlay.dataset.si = 'overlay'
  overlay.className = 'absolute inset-0 flex items-center justify-center bg-white/70 rounded-lg'
  overlay.innerHTML = `
    <div class="bg-white border border-gray-200 rounded-lg p-6 max-w-sm text-center shadow-lg">
      <p class="font-semibold m-0 mb-2">See the full scoreboard</p>
      <p class="text-gray-500 m-0 mb-4 text-[13px]">Free. No credit card.</p>
      <div class="flex flex-col gap-2">
        <input data-si="email" class="px-3 py-2 border border-gray-300 rounded-md text-sm outline-none focus:border-gray-900" type="email" placeholder="Your email" />
        <button data-si="submit" class="px-4 py-2 bg-gray-900 text-white border-none rounded-md text-sm font-medium cursor-pointer hover:bg-gray-700">Unlock scores →</button>
      </div>
    </div>
  `

  const input  = overlay.querySelector<HTMLInputElement>('[data-si="email"]')!
  const button = overlay.querySelector<HTMLButtonElement>('[data-si="submit"]')!

  button.addEventListener('click', async () => {
    const email = input.value.trim()
    if (!email) return
    button.disabled = true
    button.textContent = 'Unlocking…'

    const result = await subscribe(email)
    if (result.success) unlock(gate, gateId)
    else {
      button.disabled = false
      button.textContent = 'Unlock scores →'
    }
  })

  return overlay
}

export function mountScoreboardGate(el: HTMLElement): void {
  const gateId = el.dataset.siGate ?? 'default'
  if (isSubscribed() || isGateUnlocked(gateId)) return

  el.classList.add('relative')
  const content = el.firstElementChild as HTMLElement | null
  if (content) {
    content.dataset.si = 'blur'
    content.classList.add('blur-sm', 'select-none', 'pointer-events-none')
  }
  el.appendChild(buildOverlay(el, gateId))
}

export function mountAllScoreboardGates(): void {
  document.querySelectorAll<HTMLElement>('[data-si-gate]').forEach(mountScoreboardGate)
}
