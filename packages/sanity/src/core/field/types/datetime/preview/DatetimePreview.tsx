import {type SchemaType, type StringSchemaType} from '@sanity/types'
import {
  DEFAULT_DATE_FORMAT,
  DEFAULT_TIME_FORMAT,
  format,
  parse,
} from '@sanity/util/legacyDateFormat'
import {Box} from 'ui5'

import {type FieldPreviewComponent} from '../../../preview/types'
import {datetimeWrapper} from './DatetimePreview.css'

export const DatetimePreview: FieldPreviewComponent<string> = function DatetimePreview({
  value,
  schemaType,
}) {
  return (
    <Box className={datetimeWrapper} paddingX={2} paddingY={1}>
      {formatDateTime(value, schemaType)}
    </Box>
  )
}

function formatDateTime(value: string, schemaType: StringSchemaType): string {
  const dateFormat = schemaType.options?.dateFormat || DEFAULT_DATE_FORMAT
  const timeFormat = schemaType.options?.timeFormat || DEFAULT_TIME_FORMAT

  // Date fields store a calendar day (`YYYY-MM-DD`) with no time or offset.
  // `new Date('YYYY-MM-DD')` reads that as UTC midnight, so a timezone west of
  // UTC formats the previous day. Parse it the same way the date input does.
  if (isDateOnlyType(schemaType)) {
    const parsed = parse(value, DEFAULT_DATE_FORMAT)
    return parsed.isValid ? format(parsed.date, dateFormat) : value
  }

  return format(new Date(value), `${dateFormat} ${timeFormat}`)
}

function isDateOnlyType(schemaType: SchemaType): boolean {
  if (schemaType.name === 'date') return true
  if (schemaType.name === 'datetime') return false
  return Boolean(schemaType.type && isDateOnlyType(schemaType.type))
}
