import { injectStyles } from './styles'
import { mountAllInlineBanners } from './components/inline-banner'
import { mountAllScoreboardGates } from './components/scoreboard-gate'
import { initExitIntent } from './components/exit-intent'
import { trackClick } from './api'

function initAffiliateTracking(): void {
  document.querySelectorAll<HTMLAnchorElement>('[data-si-track="affiliate"]').forEach(link => {
    link.addEventListener('click', () => {
      const slug = link.dataset.siProduct ?? ''
      if (slug) trackClick(slug)
    })
  })
}

function init(): void {
  injectStyles()
  mountAllInlineBanners()
  mountAllScoreboardGates()
  initExitIntent()
  initAffiliateTracking()
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init)
} else {
  init()
}
