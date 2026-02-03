import {isatty} from 'node:tty'

import {type ValidationMarker} from '@sanity/types'
import logSymbols from 'log-symbols'

export type Level = ValidationMarker['level']

export interface DocumentValidationResult {
  revision: string
  documentId: string
  documentType: string
  intentUrl?: string
  level: ValidationMarker['level']
  markers: ValidationMarker[]
}

export const isTty = isatty(1)
export const levelValues = {error: 0, warning: 1, info: 2} as const

/**
 * Generates a formatted string that includes a numerical amount and a subject
 * in plural or singular form. Note: the subject must end in `s`
 */
export const count = (amount: number, subject: string): string =>
  `${amount.toLocaleString('en-US')} ${
    amount === 1 ? subject.slice(0, Math.max(0, subject.length - 1)) : subject
  }`

const percentageFormatter = new Intl.NumberFormat('en-US', {
  style: 'percent',
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
})

/**
 * Given a decimal, this will return that number formatted as a percentage
 */
export const percent = (value: number): string => percentageFormatter.format(Math.min(value, 1))

const secondFormatter = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
})

/**
 * Given a start time in milliseconds, this will output the time elapsed
 * formatted in seconds
 */
export const seconds = (startTime: number): string => {
  const endTime = Date.now()
  return `(${secondFormatter.format((endTime - startTime) / 1000)}s)`
}

interface ValidationTotals {
  valid: {documents: number}
  errors: {documents: number; markers: number}
  warnings: {documents: number; markers: number}
  infos: {documents: number; markers: number}
}

/**
 * Outputs summary text given an object of totals. Omits totals depending on the
 * desired validation `level`
 */
export const summary = (
  {errors, infos, valid, warnings}: ValidationTotals,
  level: Level = 'warning',
): string => {
  const levelValue = levelValues[level]

  return [
    `${logSymbols.success} Valid:    ${count(valid.documents, 'documents')}`,
    `${logSymbols.error} Errors:   ${count(errors.documents, 'documents')}, ${count(
      errors.markers,
      'errors',
    )}`,
    levelValue >= levelValues.warning &&
      `${logSymbols.warning} Warnings: ${count(warnings.documents, 'documents')}, ${count(
        warnings.markers,
        'warnings',
      )}`,
    levelValue >= levelValues.info &&
      `${logSymbols.info} Info:     ${count(infos.documents, 'documents')}, ${count(
        infos.documents,
        'markers',
      )}`,
  ]
    .filter(Boolean)
    .join('\n')
}
