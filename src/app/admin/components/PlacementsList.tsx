'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  DndContext, PointerSensor, useSensor, useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext, useSortable, verticalListSortingStrategy, arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

const INTENT_CLASSES: Record<string, string> = {
  buying:   'bg-sky-100 text-sky-700',
  research: 'bg-green-100 text-green-700',
  deal:     'bg-amber-100 text-amber-700',
  data:     'bg-gray-100 text-gray-600',
}

type PlacementRow = {
  id:        string
  label:     string
  position:  number
  active:    boolean
  optIn:     { intent: string } | null
  stepCount: number | null
}

type Column = { pageType: 'review' | 'best'; items: PlacementRow[] }

function SortableCard({ row, categorySlug }: { row: PlacementRow; categorySlug: string }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: row.id })
  const router = useRouter()
  const intent = row.optIn?.intent ?? ''

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className="flex items-center gap-2.5 bg-white border border-gray-200 rounded-lg px-3.5 py-2.5 mb-2 cursor-pointer hover:border-gray-400 hover:shadow-sm transition-all"
      onClick={() => router.push(`/admin?category=${categorySlug}&view=edit-optin&placement=${row.id}`)}
    >
      <span
        {...attributes}
        {...listeners}
        className="cursor-grab text-gray-400 text-base select-none"
        onClick={e => e.stopPropagation()}
      >
        ⣿
      </span>
      <span className="flex-1 font-medium text-sm text-gray-800">{row.label}</span>
      {intent && (
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${INTENT_CLASSES[intent] ?? 'bg-gray-100 text-gray-600'}`}>
          {intent}
        </span>
      )}
      {row.stepCount !== null && (
        <span className="text-xs text-gray-400 tabular-nums shrink-0">
          {row.stepCount} email{row.stepCount !== 1 ? 's' : ''}
        </span>
      )}
    </div>
  )
}

function PlacementsColumn({ col, categorySlug, onReorder }: {
  col: Column
  categorySlug: string
  onReorder: (pageType: 'review' | 'best', items: PlacementRow[]) => void
}) {
  const router  = useRouter()
  const sensors = useSensors(useSensor(PointerSensor))
  const label   = col.pageType === 'review' ? 'Review page' : 'Best / roundup page'

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIdx    = col.items.findIndex(i => i.id === active.id)
    const newIdx    = col.items.findIndex(i => i.id === over.id)
    const reordered = arrayMove(col.items, oldIdx, newIdx).map((item, idx) => ({ ...item, position: idx }))
    onReorder(col.pageType, reordered)
    fetch('/api/admin/placements/reorder', {
      method:  'PATCH',
      headers: { 'content-type': 'application/json' },
      body:    JSON.stringify({ items: reordered.map(i => ({ id: i.id, position: i.position })) }),
    })
  }

  return (
    <div className="flex-1 min-w-72">
      <p className="font-semibold text-xs text-gray-500 tracking-wide uppercase mb-3">{label}</p>
      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <SortableContext items={col.items.map(i => i.id)} strategy={verticalListSortingStrategy}>
          {col.items.map(row => (
            <SortableCard key={row.id} row={row} categorySlug={categorySlug} />
          ))}
        </SortableContext>
      </DndContext>
      <button
        onClick={() => router.push(`/admin?category=${categorySlug}&view=add-placement&pageType=${col.pageType}`)}
        className="text-gray-400 bg-transparent border-none cursor-pointer text-sm py-1 hover:text-gray-700 transition-colors"
      >
        + Add placement
      </button>
    </div>
  )
}

export function PlacementsList({ categoryId, categorySlug }: { categoryId: string; categorySlug: string }) {
  const [review, setReview] = useState<PlacementRow[]>([])
  const [best, setBest]     = useState<PlacementRow[]>([])

  useEffect(() => {
    fetch(`/api/admin/categories/${categoryId}/placements`)
      .then(r => r.json())
      .then(data => { setReview(data.review ?? []); setBest(data.best ?? []) })
  }, [categoryId])

  function handleReorder(pageType: 'review' | 'best', items: PlacementRow[]) {
    if (pageType === 'review') setReview(items)
    else setBest(items)
  }

  return (
    <div className=" max-w-7xl flex gap-8 flex-wrap items-start">
      <PlacementsColumn col={{ pageType: 'review', items: review }} categorySlug={categorySlug} onReorder={handleReorder} />
      <PlacementsColumn col={{ pageType: 'best',   items: best   }} categorySlug={categorySlug} onReorder={handleReorder} />
    </div>
  )
}
