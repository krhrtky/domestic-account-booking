'use client'

interface MonthSelectorProps {
  months: string[]
  selectedMonth: string
  onChange: (month: string) => void
}

export default function MonthSelector({ months, selectedMonth, onChange }: MonthSelectorProps) {
  return (
    <div className="flex items-center gap-2">
      <label htmlFor="settlement-month-select" className="text-sm font-medium text-gray-700">
        Month:
      </label>
      <select
        id="settlement-month-select"
        name="settlement-month"
        value={selectedMonth}
        onChange={(e) => onChange(e.target.value)}
        aria-label="Select month for settlement calculation"
        className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      >
        {months.map((month) => (
          <option key={month} value={month}>
            {month}
          </option>
        ))}
      </select>
    </div>
  )
}
