interface FormFieldProps {
  label: string
  name: string
  type: string
  error?: string
  required?: boolean
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  minLength?: number
}

export default function FormField({
  label,
  name,
  type,
  error,
  required,
  value,
  onChange,
  minLength
}: FormFieldProps) {
  const inputId = 'field-' + name
  const errorId = inputId + '-error'

  return (
    <div>
      <label htmlFor={inputId} className="block text-sm font-medium">
        {label}
      </label>
      <input
        type={type}
        id={inputId}
        name={name}
        required={required}
        value={value}
        onChange={onChange}
        minLength={minLength}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={error ? errorId : undefined}
        className={'mt-1 block w-full rounded border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ' + (error ? 'border-red-500' : 'border-gray-300')}
      />
      {error && (
        <p id={errorId} className="mt-1 text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  )
}
