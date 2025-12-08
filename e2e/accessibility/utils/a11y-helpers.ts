import { Page } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import type { AxeResults, Result } from 'axe-core'

export type { AxeResults }
export type AxeViolation = Result

export const runAxeTest = async (page: Page): Promise<AxeResults> => {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze()

  return results
}

export const formatViolations = (violations: AxeViolation[]): string => {
  if (violations.length === 0) {
    return 'No accessibility violations found'
  }

  const parts = [`Found ${violations.length} accessibility violation(s):\n\n`]

  violations.forEach((violation, index) => {
    parts.push(`${index + 1}. ${violation.id} (${violation.impact ?? 'unknown'})\n`)
    parts.push(`   Description: ${violation.description}\n`)
    parts.push(`   Help: ${violation.help}\n`)
    parts.push(`   More info: ${violation.helpUrl}\n`)
    parts.push(`   Affected elements: ${violation.nodes.length}\n`)

    violation.nodes.forEach((node, nodeIndex) => {
      parts.push(`   ${nodeIndex + 1}. ${node.html}\n`)
      parts.push(`      Target: ${node.target.join(' > ')}\n`)
      parts.push(`      Issue: ${node.failureSummary ?? 'N/A'}\n`)
    })

    parts.push('\n')
  })

  return parts.join('')
}

export const expectNoViolations = (results: AxeResults): void => {
  if (results.violations.length > 0) {
    throw new Error(formatViolations(results.violations))
  }
}
