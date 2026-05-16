'use client'

import { useState } from 'react'
import Editor from 'react-simple-code-editor'
import { highlight, languages } from 'prismjs/components/prism-core'
import 'prismjs/components/prism-markup'
import 'prismjs/themes/prism.css'

type Props = {
  value:      string
  onChange:   (val: string) => void
  onFocus?:   (e: React.FocusEvent<HTMLTextAreaElement>) => void
  minHeight?: number
}

export function HtmlEditor({ value, onChange, onFocus, minHeight = 200 }: Props) {
  const [tab, setTab] = useState<'edit' | 'preview'>('edit')

  return (
    <div className="mt-1 border border-gray-300 rounded-md overflow-hidden">
      <div className="flex border-b border-gray-200 bg-gray-50">
        {(['edit', 'preview'] as const).map(t => (
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
            {t}
          </button>
        ))}
      </div>

      {tab === 'edit' ? (
        <Editor
          value={value}
          onValueChange={onChange}
          highlight={code => highlight(code, languages.markup, 'markup')}
          padding={10}
          textareaProps={{ onFocus }}
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
        <div
          className="px-4 py-3 prose prose-sm max-w-none text-gray-800 bg-white"
          style={{ minHeight }}
          dangerouslySetInnerHTML={{ __html: value }}
        />
      )}
    </div>
  )
}
