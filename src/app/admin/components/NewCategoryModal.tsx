'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

function slugify(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}


export function NewCategoryModal({ redirectTo = '/admin' }: { redirectTo?: string }) {
  const router                    = useRouter()
  const [name, setName]           = useState('')
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState('')
  const slug = slugify(name)

  async function handleSubmit(e: { preventDefault(): void }) {
    e.preventDefault()
    if (!slug) return
    setLoading(true)
    setError('')

    const res = await fetch('/api/admin/categories', {
      method:  'POST',
      headers: { 'content-type': 'application/json' },
      body:    JSON.stringify({ slug, name }),
    })

    setLoading(false)
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      setError(data.error ?? 'Failed to create category')
      return
    }

    router.push(`${redirectTo}?category=${slug}`)
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-8 w-96 shadow-2xl">
        <p className="font-bold text-base mb-5">New category</p>

        <form onSubmit={handleSubmit}>
          <label className="text-sm font-semibold text-gray-700">Name</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. Knife sharpeners"
            autoFocus
            required
            className="block w-full px-2.5 py-2 bg-white text-gray-900 placeholder:text-gray-400 border border-gray-300 rounded-md text-sm mt-1 mb-3 outline-none focus:ring-2 focus:ring-black focus:border-transparent"
          />

          <p className="text-xs text-gray-500 mb-5">
            Slug: <code className="font-mono">{slug || '…'}</code>
          </p>

          {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

          <div className="flex gap-2.5">
            <button
              type="submit"
              disabled={loading || !slug}
              className="flex-1 py-2 bg-black text-white border-none rounded-md cursor-pointer font-semibold text-sm hover:bg-gray-800 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Creating…' : 'Create & clone from blenders'}
            </button>
            <button
              type="button"
              onClick={() => router.push(redirectTo)}
              className="px-4 py-2 bg-transparent border border-gray-300 rounded-md cursor-pointer text-sm hover:border-gray-500 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
