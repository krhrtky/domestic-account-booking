'use client'

interface MonthSelectorProps {
  months: string[]
  selectedMonth: string
  onChange: (month: string) => void
}

const formatMonth = (month: string): string => {
  const [year, m] = month.split('-')
  return `${year}年${parseInt(m)}月`
}

export default function MonthSelector({ months, selectedMonth, onChange }: MonthSelectorProps) {
  return (
    <div className="flex items-center gap-3">
      <label htmlFor="settlement-month-select" className="text-sm font-medium text-neutral-600">
        対象月
      </label>
      <div className="relative">
        <select
          id="settlement-month-select"
          name="settlement-month"
          value={selectedMonth}
          onChange={(e) => onChange(e.target.value)}
          aria-label="精算対象月を選択"
          className="appearance-none pl-4 pr-10 py-2.5 bg-white/80 backdrop-blur-sm border-2 border-neutral-200 rounded-xl text-sm font-medium text-neutral-700 cursor-pointer focus:outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/15 hover:border-neutral-300 transition-all duration-200"
        >
          {months.map((month) => (
            <option key={month} value={month}>
              {formatMonth(month)}
            </option>
          ))}
        </select>
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
          <svg className="w-4 h-4 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
    </div>
  )
}
