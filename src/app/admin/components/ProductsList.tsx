'use client'

import { useState, useEffect } from 'react'
import type { Product } from '@/db/schema'

type Props = {
  categoryId:   string
  categorySlug: string
}

export function ProductsList({ categoryId, categorySlug }: Props) {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading]   = useState(true)
  const [editing, setEditing]   = useState<Product | null>(null)
  const [creating, setCreating] = useState(false)
  const [dirty, setDirty]       = useState(false)

  useEffect(() => {
    fetch(`/api/admin/products?categoryId=${categoryId}`, { credentials: 'include' })
      .then(r => r.ok ? r.json() : [])
      .then(data => { setProducts(data); setLoading(false) })
  }, [categoryId])

  async function handleDelete(id: string) {
    if (!confirm('Delete this product?')) return
    await fetch(`/api/admin/products/${id}`, { method: 'DELETE', credentials: 'include' })
    setProducts(prev => prev.filter(p => p.id !== id))
  }

  function tryClose() {
    if (dirty && !confirm('Discard changes?')) return
    setEditing(null)
    setCreating(false)
    setDirty(false)
  }

  function handleSaved(saved: Product) {
    if (editing) {
      setProducts(prev => prev.map(p => p.id === saved.id ? saved : p))
    } else {
      setProducts(prev => [...prev, saved])
    }
    setEditing(null)
    setCreating(false)
    setDirty(false)
  }

  useEffect(() => {
    if (!dirty) return
    const handler = (e: BeforeUnloadEvent) => { e.preventDefault() }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [dirty])

  const isOpen = creating || !!editing

  if (loading) return <p className="text-sm text-gray-400">Loading…</p>

  return (
    <div>
      {products.length === 0 && !isOpen && (
        <p className="text-sm text-gray-500 mb-4">No products yet in this category.</p>
      )}

      <div className="space-y-2 mb-4">
        {products.map(p => (
          <div key={p.id} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg bg-white">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900">{p.name}</p>
              <p className="text-xs text-gray-400 font-mono truncate">{p.productId}</p>
            </div>
            {editing?.id === p.id ? (
              <button
                onClick={tryClose}
                className="text-xs px-3 py-1.5 border border-gray-300 rounded-md hover:border-gray-500 transition-colors"
              >
                Close
              </button>
            ) : (
              <button
                onClick={() => { setEditing(p); setCreating(false); setDirty(false) }}
                disabled={creating}
                className="text-xs px-3 py-1.5 border border-gray-300 rounded-md hover:border-gray-500 transition-colors disabled:opacity-40"
              >
                Edit
              </button>
            )}
            <button
              onClick={() => handleDelete(p.id)}
              className="text-xs px-3 py-1.5 border border-red-200 text-red-500 rounded-md hover:border-red-400 transition-colors"
            >
              Delete
            </button>
          </div>
        ))}
      </div>

      {!isOpen && (
        <button
          onClick={() => { setCreating(true); setDirty(false) }}
          className="text-sm px-4 py-2 border border-dashed border-gray-400 text-gray-500 rounded-lg hover:border-gray-600 hover:text-gray-700 transition-colors"
        >
          + Add product
        </button>
      )}

      {isOpen && (
        <EditProduct
          categorySlug={categorySlug}
          product={editing ?? undefined}
          onSave={handleSaved}
          onClose={tryClose}
          onDirtyChange={setDirty}
        />
      )}
    </div>
  )
}

// ─── EditProduct ──────────────────────────────────────────────────────────────

import { MetaEditor } from './MetaEditor'
import type { ProductMetaEntry } from '@/db/schema'

type EditProps = {
  categorySlug:  string
  product?:      Product
  onSave:        (saved: Product) => void
  onClose:       () => void
  onDirtyChange: (dirty: boolean) => void
}

function EditProduct({ categorySlug, product, onSave, onClose, onDirtyChange }: EditProps) {
  const [name, setName]           = useState(product?.name ?? '')
  const [productId, setProductId] = useState(product?.productId ?? '')
  const [meta, setMeta]           = useState<ProductMetaEntry[]>(product?.meta ?? [])
  const [saving, setSaving]       = useState(false)
  const [error, setError]         = useState('')

  const dirty = name !== (product?.name ?? '')
    || productId !== (product?.productId ?? '')
    || JSON.stringify(meta) !== JSON.stringify(product?.meta ?? [])

  useEffect(() => { onDirtyChange(dirty) }, [dirty, onDirtyChange])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')

    const res = product
      ? await fetch(`/api/admin/products/${product.id}`, {
          method:      'PUT',
          headers:     { 'content-type': 'application/json' },
          credentials: 'include',
          body:        JSON.stringify({ name, meta }),
        })
      : await fetch('/api/admin/products', {
          method:      'POST',
          headers:     { 'content-type': 'application/json' },
          credentials: 'include',
          body:        JSON.stringify({ productId, categorySlug, name, meta }),
        })

    setSaving(false)
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      setError(data.error ?? 'Failed to save')
      return
    }
    onDirtyChange(false)
    onSave(await res.json())
  }

  return (
    <div className="border border-gray-300 rounded-xl p-5 bg-white mt-2">
      <p className="font-semibold text-sm mb-4">{product ? 'Edit product' : 'New product'}</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Name</label>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            required
            placeholder="e.g. NutriBullet Full-Size"
            className="mt-1 block w-full px-2.5 py-2 border border-gray-300 rounded-md text-sm outline-none focus:ring-2 focus:ring-black focus:border-transparent"
          />
        </div>

        {!product && (
          <div>
            <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Product ID</label>
            <input
              value={productId}
              onChange={e => setProductId(e.target.value)}
              required
              placeholder="UUID from shouldit.com"
              className="mt-1 block w-full px-2.5 py-2 border border-gray-300 rounded-md text-sm font-mono outline-none focus:ring-2 focus:ring-black focus:border-transparent"
            />
          </div>
        )}

        <div>
          <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2 block">Meta</label>
          <MetaEditor value={meta} onChange={setMeta} />
        </div>

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <div className="flex items-center justify-between pt-1">
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 bg-black text-white rounded-md text-sm font-semibold hover:bg-gray-800 disabled:opacity-50 transition-colors"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm hover:border-gray-500 transition-colors"
          >
            Close
          </button>
        </div>
      </form>
    </div>
  )
}
