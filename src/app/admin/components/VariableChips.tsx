'use client'

const VARIABLES = [
  'product_name', 'current_price', 'low_price', 'score',
  'price_status', 'review_url', 'affiliate_url',
  'value_statement', 'product_verdict', 'test_tip',
  'use_case', 'category', 'sid',
]

export function VariableChips({ onInsert }: { onInsert: (variable: string) => void }) {
  return (
    <div>
      <p className="text-xs text-gray-500 mb-1.5">
        Variables <span className="text-[11px]">(click to insert at cursor)</span>
      </p>
      <div className="flex flex-wrap gap-1.5">
        {VARIABLES.map(v => (
          <button
            key={v}
            type="button"
            onClick={() => onInsert(`{{${v}}}`)}
            className="px-2 py-0.5 rounded text-xs bg-gray-100 border border-gray-200 cursor-pointer font-mono hover:bg-sky-50 hover:border-sky-200 hover:text-sky-700 transition-colors"
          >
            {`{{${v}}}`}
          </button>
        ))}
      </div>
      <p className="text-[11px] text-gray-400 mt-1">Resolved at send time from /api/product-meta</p>
    </div>
  )
}
