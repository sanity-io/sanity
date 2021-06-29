import React from 'react'
import * as legacyDateFormat from '@sanity/util/legacyDateFormat'
import styled from 'styled-components'
import {Box} from '@sanity/ui'
import {StringSchemaType} from '../../../diff'
import {PreviewComponent} from '../../../preview/types'

const DEFAULT_DATE_FORMAT = 'YYYY-MM-DD'
const DEFAULT_TIME_FORMAT = 'HH:mm'

const DatetimeWrapper = styled.div`
  display: inline-block;
  word-wrap: break-word;
`

export const DatetimePreview: PreviewComponent<string> = function DatetimePreview({
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
    name === 'date' ? dateFormat : `${dateFormat} ${timeFormat}`
  )
}
