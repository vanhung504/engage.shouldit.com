'use client'

import { useState } from 'react'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { ProductMetaValue } from '@/db/schema'

type ProductMetaEntry = { key: string; value: ProductMetaValue }

type MetaEntry = {
  uid:     string
  key:     string
  type:    'string' | 'object'
  strVal:  string
  objRows: { key: string; value: string }[]
}

function uid() { return Math.random().toString(36).slice(2) }

function entryToValue(e: MetaEntry): ProductMetaValue {
  if (e.type === 'string') return e.strVal
  return Object.fromEntries(e.objRows.filter(r => r.key).map(r => [r.key, r.value]))
}

function fromEntry({ key, value }: ProductMetaEntry): MetaEntry {
  if (typeof value === 'string') {
    return { uid: uid(), key, type: 'string', strVal: value, objRows: [{ key: '', value: '' }] }
  }
  const objRows = Object.entries(value).map(([k, v]) => ({ key: k, value: v }))
  return { uid: uid(), key, type: 'object', strVal: '', objRows: objRows.length ? objRows : [{ key: '', value: '' }] }
}

const inputCls = 'px-2 py-1.5 border border-gray-300 rounded text-sm outline-none focus:ring-2 focus:ring-black focus:border-transparent bg-white'

type EntryProps = {
  entry:         MetaEntry

  onUpdate:      (patch: Partial<MetaEntry>) => void
  onRemove:      () => void
  onUpdateRow:   (ri: number, patch: { key?: string; value?: string }) => void
  onAddRow:      () => void
  onRemoveRow:   (ri: number) => void
}

function SortableEntry({ entry, onUpdate, onRemove, onUpdateRow, onAddRow, onRemoveRow }: EntryProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: entry.uid })
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }

  return (
    <div ref={setNodeRef} style={style} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
      <div className="flex items-center gap-2 mb-2">
        <button
          type="button"
          className="text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing touch-none shrink-0"
          {...attributes}
          {...listeners}
        >
          <svg width="12" height="16" viewBox="0 0 12 16" fill="currentColor">
            <circle cx="3" cy="3" r="1.5"/><circle cx="9" cy="3" r="1.5"/>
            <circle cx="3" cy="8" r="1.5"/><circle cx="9" cy="8" r="1.5"/>
            <circle cx="3" cy="13" r="1.5"/><circle cx="9" cy="13" r="1.5"/>
          </svg>
        </button>
        <input
          className={`${inputCls} flex-1 font-mono`}
          placeholder="key"
          value={entry.key}
          onChange={e => onUpdate({ key: e.target.value })}
        />
        <label className="flex items-center gap-1 text-xs text-gray-500 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={entry.type === 'object'}
            onChange={e => {
              const hasData = e.target.checked ? entry.strVal : entry.objRows.some(r => r.key)
              if (hasData && !confirm('Existing value will be lost. Continue?')) return
              onUpdate({ type: e.target.checked ? 'object' : 'string' })
            }}
          />
          Object
        </label>
        <button
          type="button"
          onClick={onRemove}
          className="text-gray-400 hover:text-red-500 transition-colors text-lg leading-none px-1"
        >
          ×
        </button>
      </div>

      {entry.type === 'string' ? (
        <textarea
          className={`${inputCls} w-full resize-y`}
          rows={2}
          placeholder="value"
          value={entry.strVal}
          onChange={e => onUpdate({ strVal: e.target.value })}
        />
      ) : (
        <div className="space-y-1.5 pl-3 border-l-2 border-gray-300">
          {entry.objRows.map((row, ri) => (
            <div key={ri} className="flex items-center gap-2">
              <input
                className={`${inputCls} w-28 font-mono`}
                placeholder="key"
                value={row.key}
                onChange={e => onUpdateRow(ri, { key: e.target.value })}
              />
              <span className="text-gray-400 text-sm">→</span>
              <input
                className={`${inputCls} flex-1`}
                placeholder="value"
                value={row.value}
                onChange={e => onUpdateRow(ri, { value: e.target.value })}
              />
              <button
                type="button"
                onClick={() => onRemoveRow(ri)}
                className="text-gray-400 hover:text-red-500 transition-colors leading-none px-1"
              >
                ×
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={onAddRow}
            className="text-xs text-gray-500 hover:text-gray-800 transition-colors"
          >
            + add row
          </button>
        </div>
      )}
    </div>
  )
}

type Props = {
  value:    ProductMetaEntry[]
  onChange: (val: ProductMetaEntry[]) => void
}

export function MetaEditor({ value, onChange }: Props) {
  const [entries, setEntries] = useState<MetaEntry[]>(() => value.map(fromEntry))

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  function commit(next: MetaEntry[]) {
    setEntries(next)
    onChange(next.filter(e => e.key).map(e => ({ key: e.key, value: entryToValue(e) })))
  }

  function updateEntry(i: number, patch: Partial<MetaEntry>) {
    commit(entries.map((e, idx) => idx === i ? { ...e, ...patch } : e))
  }

  function removeEntry(i: number) {
    const e = entries[i]
    const hasData = e.key || e.strVal || e.objRows.some(r => r.key || r.value)
    if (hasData && !confirm('Remove this field? Data will be lost.')) return
    commit(entries.filter((_, idx) => idx !== i))
  }

  function updateObjRow(ei: number, ri: number, patch: { key?: string; value?: string }) {
    const entry = entries[ei]
    const objRows = entry.objRows.map((r, idx) => idx === ri ? { ...r, ...patch } : r)
    commit(entries.map((e, idx) => idx === ei ? { ...e, objRows } : e))
  }

  function addObjRow(ei: number) {
    const entry = entries[ei]
    commit(entries.map((e, idx) => idx === ei
      ? { ...e, objRows: [...entry.objRows, { key: '', value: '' }] }
      : e
    ))
  }

  function removeObjRow(ei: number, ri: number) {
    const entry = entries[ei]
    const row = entry.objRows[ri]
    if ((row.key || row.value) && !confirm('Remove this row? Data will be lost.')) return
    commit(entries.map((e, idx) => idx === ei
      ? { ...e, objRows: entry.objRows.filter((_, i) => i !== ri) }
      : e
    ))
  }

  function addEntry() {
    commit([...entries, { uid: uid(), key: '', type: 'string', strVal: '', objRows: [{ key: '', value: '' }] }])
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const from = entries.findIndex(e => e.uid === active.id)
    const to   = entries.findIndex(e => e.uid === over.id)
    commit(arrayMove(entries, from, to))
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={entries.map(e => e.uid)} strategy={verticalListSortingStrategy}>
        <div className="space-y-2">
          {entries.map((entry, ei) => (
            <SortableEntry
              key={entry.uid}
              entry={entry}

              onUpdate={patch => updateEntry(ei, patch)}
              onRemove={() => removeEntry(ei)}
              onUpdateRow={(ri, patch) => updateObjRow(ei, ri, patch)}
              onAddRow={() => addObjRow(ei)}
              onRemoveRow={ri => removeObjRow(ei, ri)}
            />
          ))}

          <button
            type="button"
            onClick={addEntry}
            className="text-sm text-gray-500 hover:text-gray-800 border border-dashed border-gray-300 rounded-lg px-3 py-2 w-full transition-colors"
          >
            + add field
          </button>
        </div>
      </SortableContext>
    </DndContext>
  )
}
