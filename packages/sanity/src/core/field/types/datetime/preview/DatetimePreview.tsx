import * as legacyDateFormat from '@sanity/util/legacyDateFormat'
import {StringSchemaType} from '@sanity/types'
import {Box} from '@sanity/ui'
import React from 'react'
import styled from 'styled-components'
import {FieldPreviewComponent} from '../../../preview'

const DEFAULT_DATE_FORMAT = 'YYYY-MM-DD'
const DEFAULT_TIME_FORMAT = 'HH:mm'

const DatetimeWrapper = styled.div`
  display: inline-block;
  word-wrap: break-word;
`

export const DatetimePreview: FieldPreviewComponent<string> = function DatetimePreview({
  value,
  schemaType,
}) {
  return (
    <Box as={DatetimeWrapper} paddingX={2} paddingY={1}>
      {formatDateTime(value, schemaType)}
    </Box>
  )
}

function formatDateTime(value: string, schemaType: StringSchemaType): string {
  const {options, name} = schemaType
  const dateFormat = options?.dateFormat || DEFAULT_DATE_FORMAT
  const timeFormat = options?.timeFormat || DEFAULT_TIME_FORMAT

  return legacyDateFormat.format(
    new Date(value),
    name === 'date' ? dateFormat : `${dateFormat} ${timeFormat}`,
  )
}
