'use client'

import { useState, useEffect } from 'react'
import Editor from 'react-simple-code-editor'
import { highlight, languages } from 'prismjs/components/prism-core'
import 'prismjs/components/prism-markup'
import 'prismjs/themes/prism.css'

type Props = {
  value:      string
  onChange:   (val: string) => void
  onFocus?:   (e: React.FocusEvent<HTMLElement>) => void
  minHeight?: number
}

const PRODUCTS = [
  { id: '6503b706-5898-4895-b9f6-b15fa304dcc7', name: 'Delta Lenta Touch2O' },
  { id: '219f6797-3c82-4a00-b973-8e5ad3eb9325', name: 'NutriBullet Full-Size' },
]

function resolvePreview(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => vars[key] ?? match)
}

export function HtmlEditor({ value, onChange, onFocus, minHeight = 200 }: Props) {
  const [tab, setTab]           = useState<'edit' | 'preview' | 'product'>('edit')
  const [productId, setProductId] = useState(PRODUCTS[0].id)
  const [meta, setMeta]         = useState<Record<string, string> | null>(null)
  const [loading, setLoading]   = useState(false)

  useEffect(() => {
    if (tab !== 'product') return
    setLoading(true)
    fetch(`/api/product-meta?productId=${productId}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => setMeta(data))
      .finally(() => setLoading(false))
  }, [tab, productId])

  const previewHtml = meta ? resolvePreview(value, meta) : value

  return (
    <div className="mt-1 border border-gray-300 rounded-md overflow-hidden">
      <div className="flex border-b border-gray-200 bg-gray-50 items-center">
        {(['edit', 'preview', 'product'] as const).map(t => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`px-3 py-1.5 text-xs font-medium cursor-pointer transition-colors capitalize ${
              tab === t
                ? 'bg-white text-gray-900 border-b-2 border-black -mb-px'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t === 'product' ? 'preview with product' : t}
          </button>
        ))}

        {tab === 'product' && (
          <select
            value={productId}
            onChange={e => setProductId(e.target.value)}
            className="ml-auto mr-2 text-xs border border-gray-200 rounded px-2 py-1 bg-white text-gray-700"
          >
            {PRODUCTS.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        )}
      </div>

      {tab === 'edit' ? (
        <Editor
          value={value}
          onValueChange={onChange}
          highlight={code => highlight(code, languages.markup, 'markup')}
          padding={10}
          onFocus={onFocus}
          style={{
            fontFamily:      'ui-monospace, SFMono-Regular, Menlo, monospace',
            fontSize:        12,
            lineHeight:      1.6,
            backgroundColor: '#fff',
            minHeight,
            outline:         'none',
          }}
        />
      ) : tab === 'preview' ? (
        <div
          className="px-4 py-3 prose prose-sm max-w-none text-gray-800 bg-white"
          style={{ minHeight }}
          dangerouslySetInnerHTML={{ __html: value }}
        />
      ) : (
        <div className="bg-white" style={{ minHeight }}>
          {loading ? (
            <p className="px-4 py-3 text-xs text-gray-400">Loading…</p>
          ) : (
            <div
              className="px-4 py-3 prose prose-sm max-w-none text-gray-800"
              dangerouslySetInnerHTML={{ __html: previewHtml }}
            />
          )}
        </div>
      )}
    </div>
  )
}
