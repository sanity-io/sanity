import {type StringSchemaType} from '@sanity/types'
import {Box} from '@sanity/ui'
import * as legacyDateFormat from '@sanity/util/legacyDateFormat'

import {type FieldPreviewComponent} from '../../../preview'
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
  const {options, name} = schemaType
  const dateFormat = options?.dateFormat || legacyDateFormat.DEFAULT_DATE_FORMAT
  const timeFormat = options?.timeFormat || legacyDateFormat.DEFAULT_TIME_FORMAT

  return legacyDateFormat.format(
    new Date(value),
    name === 'date' ? dateFormat : `${dateFormat} ${timeFormat}`,
  )
}
