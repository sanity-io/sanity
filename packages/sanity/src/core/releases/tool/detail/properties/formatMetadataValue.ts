import {isObjectSchemaType, type ObjectField, type SchemaType} from '@sanity/types'

import {getTypeChain} from '../../../../form/studio/inputResolver/helpers'
import {getPrintableType} from '../../../../util/getPrintableType'
import {isRecord} from '../../../../util/isRecord'

type MetadataKind =
  | 'string'
  | 'text'
  | 'number'
  | 'boolean'
  | 'date'
  | 'datetime'
  | 'url'
  | 'object'

const METADATA_KINDS: ReadonlySet<string> = new Set<MetadataKind>([
  'string',
  'text',
  'number',
  'boolean',
  'date',
  'datetime',
  'url',
  'object',
])

const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/

const OBJECT_FIELD_SEPARATOR = ' · '

export interface MetadataFormatters {
  number: Intl.NumberFormat
  date: Intl.DateTimeFormat
  datetime: Intl.DateTimeFormat
  yes: string
  no: string
}

export type FormattedMetadataValue =
  | {status: 'empty'}
  | {status: 'value'; text: string; href?: string}
  | {status: 'unsupported'; reason: string}

interface FormatMetadataValueOptions {
  type: SchemaType
  value: unknown
  formatters: MetadataFormatters
  isFieldHidden: (field: ObjectField, parent: Record<string, unknown>) => boolean
}

const EMPTY: FormattedMetadataValue = {status: 'empty'}

function isMetadataKind(name: string): name is MetadataKind {
  return METADATA_KINDS.has(name)
}

function metadataKind(type: SchemaType): MetadataKind | undefined {
  return getTypeChain(type, new Set())
    .map((chainType) => chainType.name)
    .find(isMetadataKind)
}

function isEmptyValue(value: unknown): boolean {
  return value === undefined || value === null || value === ''
}

function mismatch(kind: MetadataKind, value: unknown): FormattedMetadataValue {
  return {
    status: 'unsupported',
    reason: `expected a ${kind} value, but received ${getPrintableType(value)}`,
  }
}

function singleLine(text: string): string {
  return text.replace(/\s+/g, ' ').trim()
}

function optionTitle(type: SchemaType, value: string): string {
  const list: unknown = isRecord(type.options) ? type.options.list : undefined
  const option = Array.isArray(list)
    ? list.find((entry) => (isRecord(entry) ? entry.value === value : entry === value))
    : undefined
  return isRecord(option) && typeof option.title === 'string' ? option.title : value
}

function formatDate(value: string, formatters: MetadataFormatters): FormattedMetadataValue {
  const match = DATE_PATTERN.exec(value)
  if (match) {
    const [, year, month, day] = match
    return {
      status: 'value',
      text: formatters.date.format(Date.UTC(Number(year), Number(month) - 1, Number(day))),
    }
  }
  return {status: 'unsupported', reason: `"${value}" is not a YYYY-MM-DD date`}
}

function formatDatetime(value: string, formatters: MetadataFormatters): FormattedMetadataValue {
  const time = Date.parse(value)
  return Number.isNaN(time)
    ? {status: 'unsupported', reason: `"${value}" is not a date and time`}
    : {status: 'value', text: formatters.datetime.format(time)}
}

function formatScalar(
  kind: Exclude<MetadataKind, 'object'>,
  type: SchemaType,
  value: unknown,
  formatters: MetadataFormatters,
): FormattedMetadataValue {
  if (kind === 'number') {
    return typeof value === 'number' && Number.isFinite(value)
      ? {status: 'value', text: formatters.number.format(value)}
      : mismatch(kind, value)
  }
  if (kind === 'boolean') {
    return typeof value === 'boolean'
      ? {status: 'value', text: value ? formatters.yes : formatters.no}
      : mismatch(kind, value)
  }
  if (typeof value !== 'string') return mismatch(kind, value)
  if (kind === 'date') return formatDate(value, formatters)
  if (kind === 'datetime') return formatDatetime(value, formatters)
  if (kind === 'url') return {status: 'value', text: value, href: value}
  return {status: 'value', text: singleLine(optionTitle(type, value))}
}

function formatObject(
  type: SchemaType,
  value: unknown,
  options: FormatMetadataValueOptions,
): FormattedMetadataValue {
  if (!isObjectSchemaType(type) || !isRecord(value)) return mismatch('object', value)

  const parts = type.fields
    .filter((field) => !options.isFieldHidden(field, value))
    .map((field): FormattedMetadataValue & {title?: string} => {
      const kind = metadataKind(field.type)
      if (kind === 'object') {
        return {status: 'unsupported', reason: `field "${field.name}" is a nested object`}
      }
      const nested = formatMetadataValue({...options, type: field.type, value: value[field.name]})
      return nested.status === 'value' ? {...nested, title: field.type.title || field.name} : nested
    })

  const unsupported = parts.find((part) => part.status === 'unsupported')
  if (unsupported) return unsupported

  const entries = parts.flatMap((part) =>
    part.status === 'value' ? [`${part.title}: ${part.text}`] : [],
  )
  return entries.length > 0 ? {status: 'value', text: entries.join(OBJECT_FIELD_SEPARATOR)} : EMPTY
}

/** Formats a stored metadata value as one line. Metadata is untyped JSON, so a value that does not match its type is unsupported. */
export function formatMetadataValue(options: FormatMetadataValueOptions): FormattedMetadataValue {
  const {type, value, formatters} = options
  const kind = metadataKind(type)

  if (kind === undefined) {
    return {status: 'unsupported', reason: `type "${type.name}" cannot be shown on one line`}
  }
  if (isEmptyValue(value)) return EMPTY
  if (kind === 'object') return formatObject(type, value, options)
  return formatScalar(kind, type, value, formatters)
}
