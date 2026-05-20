'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { VariableChips } from './VariableChips'
import { EditSequence } from './EditSequence'

type OptIn = {
  intent:   string
  title:    string
  subtitle: string
  cta:      string
  trust:    string | null
}

type Step = {
  id:          string
  position:    number
  dayOffset:   number
  subject:     string
  previewText: string
  bodyHtml:    string
  active:      boolean
}

const INTENT_CLASSES: Record<string, string> = {
  buying:   'bg-sky-100 text-sky-700',
  research: 'bg-green-100 text-green-700',
  deal:     'bg-amber-100 text-amber-700',
  data:     'bg-gray-100 text-gray-600',
}

const inputClass = 'w-full px-2.5 py-2 bg-white text-gray-900 placeholder:text-gray-400 border border-gray-300 rounded-md text-sm mt-1 outline-none focus:ring-2 focus:ring-black focus:border-transparent resize-y'

function applyVars(text: string, vars: Record<string, string>) {
  return text.replace(/\{\{(\w+)\}\}/g, (_, k) => vars[k] || `{{${k}}}`)
}

export function EditOptIn({ placementId, categorySlug, categoryId }: { placementId: string; categorySlug: string; categoryId: string }) {
  const router                        = useRouter()
  const [optIn, setOptIn]             = useState<OptIn | null>(null)
  const [sequenceId, setSeqId]        = useState<string>('')
  const [placementLabel, setLabel]    = useState<string>('')
  const [placementIntent, setIntent]  = useState<string>('')
  const [saving, setSaving]           = useState(false)
  const [saved, setSaved]             = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [varValues, setVarValues]     = useState<Record<string, string>>({})
  const [steps, setSteps]             = useState<Step[]>([])
  const focusedRef = useRef<{ el: HTMLInputElement | HTMLTextAreaElement; update: (val: string) => void } | null>(null)
  const saveVarsTimer                 = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    fetch(`/api/admin/opt-in-configs/${placementId}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data) return
        setOptIn(data)
        if (data.previewVars) setVarValues(data.previewVars)
      })

    fetch(`/api/admin/placements/${placementId}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data) return
        const intent = data.optIn?.intent ?? data.intent ?? ''
        setLabel(data.label ?? '')
        setIntent(intent)
        let seq = `${categorySlug}_${intent}`
        if (intent === 'deal') seq = 'deal_hunter'
        if (intent === 'data') seq = 'power_user'
        setSeqId(seq)
      })
  }, [placementId, categorySlug])

  useEffect(() => {
    if (!sequenceId) return
    fetch(`/api/admin/sequences/${sequenceId}/steps`)
      .then(r => r.ok ? r.json() : [])
      .then(setSteps)
  }, [sequenceId])

  useEffect(() => {
    if (!optIn) return
    if (saveVarsTimer.current) clearTimeout(saveVarsTimer.current)
    saveVarsTimer.current = setTimeout(() => {
      fetch(`/api/admin/opt-in-configs/${placementId}`, {
        method:  'PUT',
        headers: { 'content-type': 'application/json' },
        body:    JSON.stringify({ ...optIn, previewVars: varValues }),
      })
    }, 2000)
    return () => { if (saveVarsTimer.current) clearTimeout(saveVarsTimer.current) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [varValues])

  const detectedVars = useMemo(() => {
    if (!optIn) return []
    const optInText  = [optIn.title, optIn.subtitle, optIn.cta, optIn.trust ?? ''].join(' ')
    const stepsText  = steps.map(s => [s.subject, s.previewText, s.bodyHtml].join(' ')).join(' ')
    return [...new Set([...(optInText + ' ' + stepsText).matchAll(/\{\{(\w+)\}\}/g)].map(m => m[1]))]
  }, [optIn, steps])

  function insertAtCursor(variable: string) {
    const focused = focusedRef.current
    if (!focused) return
    const { el, update } = focused
    const start  = el.selectionStart ?? 0
    const end    = el.selectionEnd ?? 0
    const newVal = el.value.slice(0, start) + variable + el.value.slice(end)
    update(newVal)
    setTimeout(() => {
      el.selectionStart = el.selectionEnd = start + variable.length
      el.focus()
    }, 0)
  }

  const handleFocus = useCallback((e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const el    = e.target
    const field = el.name as keyof OptIn
    focusedRef.current = {
      el,
      update: (val: string) => setOptIn(prev => prev ? { ...prev, [field]: val } : prev),
    }
  }, [])

  const handleFieldFocus = useCallback((
    el:     HTMLInputElement | HTMLTextAreaElement,
    update: (val: string) => void,
  ) => {
    focusedRef.current = { el, update }
  }, [])

  async function handleSave(e: { preventDefault(): void }) {
    e.preventDefault()
    if (!optIn) return
    setSaving(true)
    await fetch(`/api/admin/opt-in-configs/${placementId}`, {
      method:  'PUT',
      headers: { 'content-type': 'application/json' },
      body:    JSON.stringify(optIn),
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  if (!optIn) return <p className="text-gray-500 text-sm">Loading…</p>

  const fieldProps = (name: keyof OptIn) => ({
    name,
    value:     String(optIn[name] ?? ''),
    onChange:  (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
                 setOptIn({ ...optIn, [name]: e.target.value }),
    onFocus:   handleFocus,
    className: inputClass,
  })

  const preview = {
    title:    applyVars(optIn.title, varValues),
    subtitle: applyVars(optIn.subtitle, varValues),
    cta:      applyVars(optIn.cta, varValues),
    trust:    optIn.trust ? applyVars(optIn.trust, varValues) : null,
  }

  return (
    <div className="max-w-7xl">
      {/* Info box */}
      <div className="bg-white border border-gray-200 rounded-lg mb-6 overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-0.5">Placement</p>
            <p className="font-semibold text-gray-900 truncate">{placementLabel || '…'}</p>
          </div>
          {placementIntent && (
            <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize shrink-0 ${INTENT_CLASSES[placementIntent] ?? 'bg-gray-100 text-gray-600'}`}>
              {placementIntent}
            </span>
          )}
          <button
            onClick={() => setShowPreview(p => !p)}
            className={`ml-2 px-3 py-1.5 rounded-md text-xs font-medium border cursor-pointer transition-colors ${
              showPreview
                ? 'bg-gray-900 text-white border-gray-900'
                : 'bg-white text-gray-600 border-gray-300 hover:border-gray-500'
            }`}
          >
            {showPreview ? 'Hide preview' : 'Preview'}
          </button>
        </div>

        {showPreview && (
          <div className="border-t border-gray-100 px-4 py-4 space-y-5">
            {/* Variable test inputs */}
            {detectedVars.length > 0 && (
              <div>
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Test values</p>
                {(() => {
                  const LONG_VARS = ['product_verdict', 'value_statement', 'test_tip']
                  const baseClass = 'text-xs bg-gray-50 border border-gray-200 rounded outline-none focus:ring-1 focus:ring-black'
                  const shorts = detectedVars.filter(v => !LONG_VARS.includes(v))
                  const longs  = detectedVars.filter(v =>  LONG_VARS.includes(v))
                  return (
                    <div className="space-y-3">
                      {shorts.length > 0 && (
                        <div className="flex flex-wrap gap-3">
                          {shorts.map(v => (
                            <div key={v} className="flex items-center gap-1.5">
                              <span className="text-xs text-gray-500 font-mono shrink-0">{`{{${v}}}`}</span>
                              <input
                                type="text"
                                placeholder="value…"
                                value={varValues[v] ?? ''}
                                onChange={e => setVarValues(prev => ({ ...prev, [v]: e.target.value }))}
                                className={`${baseClass} px-2 py-1 w-32`}
                              />
                            </div>
                          ))}
                        </div>
                      )}
                      {longs.map(v => (
                        <div key={v} className="flex flex-col gap-1">
                          <span className="text-xs text-gray-500 font-mono">{`{{${v}}}`}</span>
                          <textarea
                            rows={3}
                            placeholder="value…"
                            value={varValues[v] ?? ''}
                            onChange={e => setVarValues(prev => ({ ...prev, [v]: e.target.value }))}
                            className={`${baseClass} px-2 py-1 w-full resize-y`}
                          />
                        </div>
                      ))}
                    </div>
                  )
                })()}
              </div>
            )}

            {/* Opt-in card preview */}
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Opt-in card</p>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 max-w-sm">
                <p className="font-bold text-gray-900 text-base leading-snug mb-1">{preview.title || <span className="text-gray-300">Title…</span>}</p>
                <p className="text-gray-600 text-sm mb-3 leading-snug">{preview.subtitle || <span className="text-gray-300">Subtitle…</span>}</p>
                <button className="w-full py-2 bg-gray-900 text-white text-sm font-semibold rounded-md cursor-default">
                  {preview.cta || 'CTA…'}
                </button>
                {preview.trust && (
                  <p className="text-center text-xs text-gray-400 mt-2">{preview.trust}</p>
                )}
              </div>
            </div>

            {/* Email sequence preview */}
            {steps.length > 0 && (
              <div>
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">Email sequence</p>
                <div className="space-y-3">
                  {steps.map((step, i) => (
                    <div key={step.id} className="border border-gray-200 rounded-lg overflow-hidden">
                      <div className="flex items-center gap-3 px-4 py-2.5 bg-gray-50 border-b border-gray-100">
                        <span className="text-xs font-medium text-gray-500 shrink-0">#{i + 1} · Day {step.dayOffset}</span>
                        <span className="flex-1 text-sm font-medium text-gray-800 truncate">
                          {applyVars(step.subject, varValues)}
                        </span>
                        {!step.active && (
                          <span className="text-xs text-gray-400 shrink-0">inactive</span>
                        )}
                      </div>
                      <div className="px-4 py-3">
                        <p className="text-xs text-gray-400 mb-2 italic">{applyVars(step.previewText, varValues)}</p>
                        <div
                          className="text-sm text-gray-700 prose prose-sm max-w-none"
                          dangerouslySetInnerHTML={{ __html: applyVars(step.bodyHtml, varValues) }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex gap-8 items-start flex-wrap">
        {/* Left: form */}
        <div className="flex-1 min-w-80 max-w-xl">
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="text-sm font-semibold text-gray-700">Title</label>
              <input type="text" {...fieldProps('title')} />
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700">Subtitle</label>
              <textarea rows={3} {...fieldProps('subtitle')} />
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700">CTA</label>
              <input type="text" {...fieldProps('cta')} />
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700">Trust line</label>
              <input type="text" {...(fieldProps('trust') as React.InputHTMLAttributes<HTMLInputElement>)} />
            </div>

            <VariableChips onInsert={insertAtCursor} />

            <div className="flex gap-3 items-center pt-1">
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2 bg-black text-white rounded-md cursor-pointer font-semibold text-sm hover:bg-gray-800 disabled:opacity-50 transition-colors"
              >
                {saving ? 'Saving…' : saved ? '✓ Saved' : 'Save changes'}
              </button>
              <button
                type="button"
                onClick={() => router.push(`/admin?category=${categorySlug}`)}
                className="px-4 py-2 bg-transparent border border-gray-300 rounded-md cursor-pointer text-sm hover:border-gray-500 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>

        {/* Right: sequence + alerts */}
        <div className="flex-1 min-w-72 space-y-8">
          {sequenceId && (
            <div>
              <p className="font-semibold text-xs text-gray-500 tracking-wide uppercase mb-3">
                Email sequence
              </p>
              <EditSequence sequenceId={sequenceId} categoryId={categoryId} onFieldFocus={handleFieldFocus} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
