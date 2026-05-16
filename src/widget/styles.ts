// Capture before any async callbacks — currentScript is only available during sync evaluation
const _scriptSrc = (document.currentScript as HTMLScriptElement | null)?.src ?? ''

export function injectStyles(): void {
  if (document.getElementById('si-styles')) return
  const href = _scriptSrc.replace(/widget\.js(\?.*)?$/, 'widget.css')
  if (!href) return
  const link = document.createElement('link')
  link.id = 'si-styles'
  link.rel = 'stylesheet'
  link.href = href
  document.head.appendChild(link)
}
