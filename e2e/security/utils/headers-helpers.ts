import { Response, APIResponse } from '@playwright/test'

export type SecurityHeader = {
  name: string
  expectedValue: string
}

export const SECURITY_HEADERS: SecurityHeader[] = [
  { name: 'x-frame-options', expectedValue: 'DENY' },
  { name: 'content-security-policy', expectedValue: "frame-ancestors 'none'" },
  { name: 'x-content-type-options', expectedValue: 'nosniff' },
  { name: 'referrer-policy', expectedValue: 'strict-origin-when-cross-origin' },
]

export const verifySecurityHeaders = (response: Response | APIResponse | null): void => {
  if (!response) {
    throw new Error('No response received')
  }

  const headers = response.headers()
  const missingHeaders: string[] = []
  const incorrectHeaders: Array<{ name: string; expected: string; actual: string }> = []

  SECURITY_HEADERS.forEach(({ name, expectedValue }) => {
    const actualValue = headers[name]

    if (!actualValue) {
      missingHeaders.push(name)
    } else if (actualValue !== expectedValue) {
      incorrectHeaders.push({ name, expected: expectedValue, actual: actualValue })
    }
  })

  if (missingHeaders.length > 0 || incorrectHeaders.length > 0) {
    const errorParts: string[] = ['Security header validation failed:\n']

    if (missingHeaders.length > 0) {
      errorParts.push(`\nMissing headers:\n`)
      missingHeaders.forEach(header => {
        errorParts.push(`  - ${header}\n`)
      })
    }

    if (incorrectHeaders.length > 0) {
      errorParts.push(`\nIncorrect header values:\n`)
      incorrectHeaders.forEach(({ name, expected, actual }) => {
        errorParts.push(`  - ${name}\n`)
        errorParts.push(`    Expected: ${expected}\n`)
        errorParts.push(`    Actual: ${actual}\n`)
      })
    }

    throw new Error(errorParts.join(''))
  }
}

export const formatHeaders = (response: Response | APIResponse | null): string => {
  if (!response) {
    return 'No response'
  }

  const headers = response.headers()
  const parts: string[] = ['Security Headers:\n']

  SECURITY_HEADERS.forEach(({ name }) => {
    const value = headers[name] || '(missing)'
    parts.push(`  ${name}: ${value}\n`)
  })

  return parts.join('')
}
