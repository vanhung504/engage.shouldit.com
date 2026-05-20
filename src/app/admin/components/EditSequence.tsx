'use client'

import { useEffect, useState } from 'react'
import { HtmlEditor } from './HtmlEditor'
import {
  DndContext, PointerSensor, useSensor, useSensors, type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext, useSortable, verticalListSortingStrategy, arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

type Step = {
  id:           string
  sequenceId:   string
  position:     number
  dayOffset:    number
  subject:      string
  previewText:  string
  bodyHtml:     string
  conditionKey: string | null
  active:       boolean
}

type OnFieldFocus = (el: HTMLInputElement | HTMLTextAreaElement, update: (val: string) => void) => void

const CONDITIONS = [
  { value: '',                   label: 'None (always send)' },
  { value: 'not_pro',            label: 'Only if not Pro' },
  { value: 'has_clicked_amazon', label: 'Only if clicked Amazon' },
  { value: 'has_use_case_tag',   label: 'Only if has use case tag' },
  { value: 'price_status_good',  label: 'Only if price status: good' },
  { value: 'price_status_fair',  label: 'Only if price status: fair' },
  { value: 'price_status_high',  label: 'Only if price status: high' },
]

const inputClass = 'w-full px-2.5 py-2 bg-white text-gray-900 placeholder:text-gray-400 border border-gray-300 rounded-md text-sm mt-1 outline-none focus:ring-2 focus:ring-black focus:border-transparent'

function StepCard({ step, categoryId, onSave, onDelete, onUpdate, onFieldFocus }: {
  step:          Step
  categoryId?:   string
  onSave:        (id: string, patch: Partial<Step>) => Promise<void>
  onDelete:      (id: string) => Promise<void>
  onUpdate:      (id: string, patch: Partial<Step>) => void
  onFieldFocus?: OnFieldFocus
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: step.id })
  const [expanded, setExpanded] = useState(false)
  const [saving, setSaving]     = useState(false)
  const [saved, setSaved]       = useState(false)

  async function save() {
    setSaving(true)
    await onSave(step.id, {
      dayOffset:    step.dayOffset,
      subject:      step.subject,
      previewText:  step.previewText,
      bodyHtml:     step.bodyHtml,
      conditionKey: step.conditionKey,
      active:       step.active,
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  function fieldFocus(name: keyof Step) {
    return (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      onFieldFocus?.(e.target, (val) => onUpdate(step.id, { [name]: val }))
    }
  }

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className="mb-2"
    >
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="flex items-center gap-2.5 px-3.5 py-2.5">
          <span {...attributes} {...listeners} className="cursor-grab text-gray-400 text-base select-none">⣿</span>
          {step.conditionKey && (
            <span className="text-xs text-gray-400 font-mono shrink-0">{step.conditionKey}</span>
          )}
          <span className="flex-1 text-sm font-medium text-gray-800 truncate">{step.subject}</span>
          {!step.active && <span className="text-xs text-gray-400 shrink-0">inactive</span>}
          <button
            onClick={() => setExpanded(e => !e)}
            className="px-2.5 py-1 text-xs border border-gray-200 rounded bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors"
          >
            {expanded ? 'Close' : 'Edit'}
          </button>
          <button
            onClick={() => onDelete(step.id)}
            className="px-2 py-1 text-xs border border-red-200 rounded text-red-600 hover:bg-red-50 cursor-pointer transition-colors"
          >
            ×
          </button>
        </div>

        {expanded && (
          <div className="px-3.5 pb-3.5 border-t border-gray-100 pt-3">
            <div className="flex gap-3 mb-3">
              <div className="w-20 shrink-0">
                <label className="text-xs font-semibold text-gray-700">Day offset</label>
                <input
                  type="number"
                  value={step.dayOffset}
                  onChange={e => onUpdate(step.id, { dayOffset: +e.target.value })}
                  className={inputClass + ' w-20'}
                />
              </div>
              <div className="flex-1">
                <label className="text-xs font-semibold text-gray-700">Condition</label>
                <select
                  value={step.conditionKey ?? ''}
                  onChange={e => onUpdate(step.id, { conditionKey: e.target.value || null })}
                  className={inputClass}
                >
                  {CONDITIONS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
            </div>

            <div className="mb-3">
              <label className="text-xs font-semibold text-gray-700">Subject</label>
              <input
                type="text"
                name="subject"
                value={step.subject}
                onChange={e => onUpdate(step.id, { subject: e.target.value })}
                onFocus={fieldFocus('subject')}
                className={inputClass}
              />
            </div>

            <div className="mb-3">
              <label className="text-xs font-semibold text-gray-700">Preview text</label>
              <input
                type="text"
                name="previewText"
                value={step.previewText}
                onChange={e => onUpdate(step.id, { previewText: e.target.value })}
                onFocus={fieldFocus('previewText')}
                className={inputClass}
              />
            </div>

            <div className="mb-3">
              <label className="text-xs font-semibold text-gray-700">Body HTML</label>
              <HtmlEditor
                value={step.bodyHtml}
                onChange={val => onUpdate(step.id, { bodyHtml: val })}
                onFocus={e => onFieldFocus?.(e.target as HTMLTextAreaElement, val => onUpdate(step.id, { bodyHtml: val }))}
                categoryId={categoryId}
                conditionKey={step.conditionKey}
              />
            </div>

            <div className="flex gap-2.5 items-center">
              <button
                onClick={save}
                disabled={saving}
                className="px-4 py-1.5 bg-black text-white rounded-md cursor-pointer font-semibold text-sm hover:bg-gray-800 disabled:opacity-50 transition-colors"
              >
                {saving ? 'Saving…' : saved ? '✓ Saved' : 'Save'}
              </button>
              <button
                onClick={() => setExpanded(false)}
                className="px-3 py-1.5 bg-transparent border border-gray-300 rounded-md cursor-pointer text-sm hover:border-gray-500 transition-colors"
              >
                Cancel
              </button>
              <label className="ml-auto flex items-center gap-1.5 text-sm cursor-pointer text-gray-700">
                <input
                  type="checkbox"
                  checked={step.active}
                  onChange={e => onUpdate(step.id, { active: e.target.checked })}
                  className="cursor-pointer"
                />
                Active
              </label>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export function EditSequence({ sequenceId, categoryId, onFieldFocus }: {
  sequenceId:    string
  categoryId?:   string
  onFieldFocus?: OnFieldFocus
}) {
  const sensors           = useSensors(useSensor(PointerSensor))
  const [steps, setSteps] = useState<Step[]>([])

  useEffect(() => {
    fetch(`/api/admin/sequences/${sequenceId}/steps`)
      .then(r => r.json())
      .then(setSteps)
  }, [sequenceId])

  function updateLocal(id: string, patch: Partial<Step>) {
    setSteps(prev => prev.map(s => s.id === id ? { ...s, ...patch } : s))
  }

  async function saveStep(id: string, patch: Partial<Step>) {
    await fetch(`/api/admin/sequence-steps/${id}`, {
      method:  'PATCH',
      headers: { 'content-type': 'application/json' },
      body:    JSON.stringify(patch),
    })
  }

  async function deleteStep(id: string) {
    if (!confirm('Delete this step?')) return
    await fetch(`/api/admin/sequence-steps/${id}`, { method: 'DELETE' })
    setSteps(prev => prev.filter(s => s.id !== id))
  }

  async function addStep() {
    const lastOffset = steps[steps.length - 1]?.dayOffset ?? -3
    const body = {
      dayOffset:   lastOffset + 3,
      subject:     'New email subject',
      previewText: 'Preview text',
      bodyHtml:    '<p>Email body here.</p>',
      position:    steps.length,
    }
    const res  = await fetch(`/api/admin/sequences/${sequenceId}/steps`, {
      method:  'POST',
      headers: { 'content-type': 'application/json' },
      body:    JSON.stringify(body),
    })
    const step = await res.json()
    setSteps(prev => [...prev, step])
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIdx    = steps.findIndex(s => s.id === active.id)
    const newIdx    = steps.findIndex(s => s.id === over.id)
    const reordered = arrayMove(steps, oldIdx, newIdx).map((s, i) => ({ ...s, position: i }))
    setSteps(reordered)
    fetch(`/api/admin/sequences/${sequenceId}/reorder`, {
      method:  'PATCH',
      headers: { 'content-type': 'application/json' },
      body:    JSON.stringify({ items: reordered.map(s => ({ id: s.id, position: s.position })) }),
    })
  }

  const groups = steps.reduce<{ dayOffset: number; steps: Step[] }[]>((acc, step) => {
    const last = acc[acc.length - 1]
    if (last && last.dayOffset === step.dayOffset) {
      last.steps.push(step)
    } else {
      acc.push({ dayOffset: step.dayOffset, steps: [step] })
    }
    return acc
  }, [])

  return (
    <div className="max-w-2xl">
      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <SortableContext items={steps.map(s => s.id)} strategy={verticalListSortingStrategy}>
          {groups.map(group => (
            <div key={group.dayOffset} className="mb-4">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Day {group.dayOffset}
                </span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>
              {group.steps.map(step => (
                <StepCard
                  key={step.id}
                  step={step}
                  categoryId={categoryId}
                  onSave={saveStep}
                  onDelete={deleteStep}
                  onUpdate={updateLocal}
                  onFieldFocus={onFieldFocus}
                />
              ))}
            </div>
          ))}
        </SortableContext>
      </DndContext>

      <button
        onClick={addStep}
        className="mt-2 px-4 py-2 bg-gray-100 border border-dashed border-gray-400 rounded-md cursor-pointer text-sm text-gray-600 hover:bg-gray-200 hover:border-gray-500 transition-colors"
      >
        + Add step
      </button>
    </div>
  )
}
