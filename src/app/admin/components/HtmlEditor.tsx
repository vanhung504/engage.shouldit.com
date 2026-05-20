'use client'

import { useState, useEffect } from 'react'
import Editor from 'react-simple-code-editor'
import { highlight, languages } from 'prismjs/components/prism-core'
import 'prismjs/components/prism-markup'
import 'prismjs/themes/prism.css'
import { applyVars } from '@/lib/utils'

type Props = {
  value:         string
  onChange:      (val: string) => void
  onFocus?:      (e: React.FocusEvent<HTMLElement>) => void
  minHeight?:    number
  categoryId?:   string
  conditionKey?: string | null
}

const CONDITION_TO_STATUS: Record<string, string> = {
  price_status_good:          'good',
  price_status_fair:          'fair',
  price_status_high:          'high',
  price_status_all_time_low:  'all-time-low',
}

type ProductOption = { productId: string; name: string }

export function HtmlEditor({ value, onChange, onFocus, minHeight = 200, categoryId, conditionKey }: Props) {
  const [tab, setTab]             = useState<'edit' | 'product'>('edit')
  const [products, setProducts]   = useState<ProductOption[]>([])
  const [productId, setProductId] = useState<string>('')
  const [meta, setMeta]           = useState<Record<string, string> | null>(null)

  const forceStatus = conditionKey ? (CONDITION_TO_STATUS[conditionKey] ?? '') : ''

  useEffect(() => {
    if (!categoryId) return
    fetch(`/api/admin/products?categoryId=${categoryId}`, { credentials: 'include' })
      .then(r => r.ok ? r.json() : [])
      .then((rows: ProductOption[]) => {
        setProducts(rows)
        if (rows.length) setProductId(rows[0].productId)
      })
  }, [categoryId])

  useEffect(() => {
    if (tab !== 'product' || !productId) return
    const qs = forceStatus ? `&force_status=${forceStatus}` : ''
    fetch(`/api/product-meta?productId=${productId}${qs}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => setMeta(data))
  }, [tab, productId, forceStatus])

  const previewHtml = meta ? applyVars(value, meta) : value

  return (
    <div className="mt-1 border border-gray-300 rounded-md overflow-hidden">
      <div className="flex border-b border-gray-200 bg-gray-50 items-center">
        {(['edit', 'product'] as const).map(t => (
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
            {t === 'product' ? 'preview' : t}
          </button>
        ))}

        {tab === 'product' && products.length > 0 && (
          <div className="ml-auto mr-2 flex items-center gap-2">
            {forceStatus && (
              <span className="text-xs text-gray-400 font-mono">price_status: {forceStatus}</span>
            )}
            <select
              value={productId}
              onChange={e => { setProductId(e.target.value); setMeta(null) }}
              className="text-xs border border-gray-200 rounded px-2 py-1 bg-white text-gray-700"
            >
              {products.map(p => (
                <option key={p.productId} value={p.productId}>{p.name}</option>
              ))}
            </select>
          </div>
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
      ) : (
        <div className="bg-white" style={{ minHeight }}>
          {productId && meta === null ? (
            <p className="px-4 py-3 text-xs text-gray-400">Loading…</p>
          ) : !productId ? (
            <p className="px-4 py-3 text-xs text-gray-400">No products in this category.</p>
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
