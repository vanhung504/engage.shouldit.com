'use client'

import { useEffect, useState } from 'react'
import { HtmlEditor } from './HtmlEditor'

type AlertTemplate = {
  id:           string
  categoryId:   string
  alertType:    string
  intent:       string | null
  conditionKey: string | null
  subject:      string
  previewText:  string
  bodyHtml:     string
  active:       boolean
}

const ALERT_TYPES: { value: string; label: string; description: string }[] = [
  {
    value:       'price_drop',
    label:       'Price drop',
    description: 'Sent when price drops ≥$5 from the last alert price and is within 10% of the historical low.',
  },
]

const INTENTS = [
  { value: '',         label: 'Any intent' },
  { value: 'buying',   label: 'Buying' },
  { value: 'deal',     label: 'Deal' },
  { value: 'research', label: 'Research' },
  { value: 'data',     label: 'Data' },
]

const CONDITION_KEYS = [
  { value: '',                  label: 'No condition' },
  { value: 'not_pro',           label: 'not_pro' },
  { value: 'has_clicked_amazon', label: 'has_clicked_amazon' },
  { value: 'has_use_case_tag',  label: 'has_use_case_tag' },
  { value: 'price_status_good', label: 'price_status_good' },
  { value: 'price_status_fair', label: 'price_status_fair' },
  { value: 'price_status_high', label: 'price_status_high' },
]

const inputClass = 'w-full px-2.5 py-2 bg-white text-gray-900 placeholder:text-gray-400 border border-gray-300 rounded-md text-sm mt-1 outline-none focus:ring-2 focus:ring-black focus:border-transparent'

function AlertCard({ template, onSave, onUpdate, onDelete }: {
  template: AlertTemplate
  onSave:   (id: string, patch: Partial<AlertTemplate>) => Promise<void>
  onUpdate: (id: string, patch: Partial<AlertTemplate>) => void
  onDelete: (id: string) => Promise<void>
}) {
  const [expanded, setExpanded] = useState(false)
  const [saving, setSaving]     = useState(false)

  async function save() {
    setSaving(true)
    await onSave(template.id, {
      intent:       template.intent,
      conditionKey: template.conditionKey,
      subject:      template.subject,
      previewText:  template.previewText,
      bodyHtml:     template.bodyHtml,
      active:       template.active,
    })
    setSaving(false)
    setExpanded(false)
  }

  const typeLabel = ALERT_TYPES.find(t => t.value === template.alertType)?.label ?? template.alertType

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden mb-2">
      <div className="flex items-center gap-2.5 px-3.5 py-2.5">
        <span className="text-amber-500 text-sm shrink-0">⚡</span>
        <span className="flex-1 text-sm font-medium text-gray-800 truncate">
          {typeLabel}{template.intent ? ` · ${template.intent}` : ''} — {template.subject || <span className="text-gray-400">No subject</span>}
        </span>
        {!template.active && (
          <span className="text-xs text-gray-400 shrink-0">inactive</span>
        )}
        <button
          onClick={() => setExpanded(e => !e)}
          className="px-2.5 py-1 text-xs border border-gray-200 rounded bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors"
        >
          {expanded ? 'Close' : 'Edit'}
        </button>
        <button
          onClick={() => onDelete(template.id)}
          className="px-2 py-1 text-xs border border-red-200 rounded text-red-600 hover:bg-red-50 cursor-pointer transition-colors"
        >
          ×
        </button>
      </div>

      {expanded && (
        <div className="px-3.5 pb-3.5 border-t border-gray-100 pt-3 space-y-3">
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-xs font-semibold text-gray-700">Intent</label>
              <select
                value={template.intent ?? ''}
                onChange={e => onUpdate(template.id, { intent: e.target.value || null })}
                className={inputClass}
              >
                {INTENTS.map(i => (
                  <option key={i.value} value={i.value}>{i.label}</option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="text-xs font-semibold text-gray-700">Condition</label>
              <select
                value={template.conditionKey ?? ''}
                onChange={e => onUpdate(template.id, { conditionKey: e.target.value || null })}
                className={inputClass}
              >
                {CONDITION_KEYS.map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-700">Subject</label>
            <input
              type="text"
              value={template.subject}
              onChange={e => onUpdate(template.id, { subject: e.target.value })}
              className={inputClass}
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-700">Preview text</label>
            <input
              type="text"
              value={template.previewText}
              onChange={e => onUpdate(template.id, { previewText: e.target.value })}
              className={inputClass}
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-700">Body HTML</label>
            <HtmlEditor
              value={template.bodyHtml}
              onChange={val => onUpdate(template.id, { bodyHtml: val })}
            />
          </div>
          <div className="flex gap-2.5 items-center">
            <button
              onClick={save}
              disabled={saving}
              className="px-4 py-1.5 bg-black text-white rounded-md cursor-pointer font-semibold text-sm hover:bg-gray-800 disabled:opacity-50 transition-colors"
            >
              {saving ? 'Saving…' : 'Save'}
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
                checked={template.active}
                onChange={e => onUpdate(template.id, { active: e.target.checked })}
                className="cursor-pointer"
              />
              Active
            </label>
          </div>
        </div>
      )}
    </div>
  )
}

export function EditAlerts({ categoryId }: { categoryId: string }) {
  const [templates, setTemplates] = useState<AlertTemplate[]>([])
  const [adding, setAdding]       = useState(false)

  useEffect(() => {
    fetch(`/api/admin/alert-templates?categoryId=${categoryId}`)
      .then(r => r.ok ? r.json() : [])
      .then(setTemplates)
  }, [categoryId])

  function updateLocal(id: string, patch: Partial<AlertTemplate>) {
    setTemplates(prev => prev.map(t => t.id === id ? { ...t, ...patch } : t))
  }

  async function saveTemplate(id: string, patch: Partial<AlertTemplate>) {
    await fetch(`/api/admin/alert-templates/${id}`, {
      method:  'PUT',
      headers: { 'content-type': 'application/json' },
      body:    JSON.stringify(patch),
    })
  }

  async function deleteTemplate(id: string) {
    if (!confirm('Delete this alert template?')) return
    await fetch(`/api/admin/alert-templates/${id}`, { method: 'DELETE' })
    setTemplates(prev => prev.filter(t => t.id !== id))
  }

  async function addAlert(alertType: string) {
    setAdding(true)
    const res = await fetch('/api/admin/alert-templates', {
      method:  'POST',
      headers: { 'content-type': 'application/json' },
      body:    JSON.stringify({
        categoryId,
        alertType,
        intent:      null,
        conditionKey: null,
        subject:     '',
        previewText: '',
        bodyHtml:    '<p>Email body here.</p>',
      }),
    })
    const created = await res.json()
    setTemplates(prev => [...prev, created])
    setAdding(false)
  }

  const existingTypes = templates.map(t => t.alertType)
  const availableTypes = ALERT_TYPES.filter(t => !existingTypes.includes(t.value))

  return (
    <div>
      {ALERT_TYPES.map(type => (
        <p key={type.value} className="text-xs text-gray-400 mb-3">{type.description}</p>
      ))}

      {availableTypes.map(type => (
        <div key={type.value} className="mb-3">
          <button
            onClick={() => addAlert(type.value)}
            disabled={adding}
            className="px-4 py-2 bg-gray-50 border border-dashed border-gray-400 rounded-md cursor-pointer text-sm text-gray-600 hover:bg-gray-100 hover:border-gray-500 transition-colors disabled:opacity-50"
          >
            <span className="text-amber-500 mr-1.5">⚡</span>
            + Add {type.label} alert
          </button>
        </div>
      ))}

      {templates.map(t => (
        <AlertCard
          key={t.id}
          template={t}
          onSave={saveTemplate}
          onUpdate={updateLocal}
          onDelete={deleteTemplate}
        />
      ))}
    </div>
  )
}
