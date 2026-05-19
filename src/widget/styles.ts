const CSS = `
  .si-btn:hover { filter: brightness(1.12); }
  .si-input { outline: none; }
  .si-input:focus { outline: 2px solid #1e2d5a; outline-offset: -1px; }
  .si-input-light { outline: none; }
  .si-input-light:focus { outline: 2px solid #111827; outline-offset: -1px; }
`

export function injectStyles(): void {
  if (document.getElementById('si-styles')) return
  const style = document.createElement('style')
  style.id = 'si-styles'
  style.textContent = CSS
  document.head.appendChild(style)
}
