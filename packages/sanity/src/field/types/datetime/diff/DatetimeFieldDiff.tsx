import {StringSchemaType} from '@sanity/types'
import {Box} from '@sanity/ui'
import React from 'react'
import {DiffFromTo} from '../../../diff'
import {DiffComponent, StringDiff} from '../../../types'
import {DatetimePreview} from '../preview'

export interface DatetimeFieldDiffProps {
  diff: StringDiff
  schemaType: StringSchemaType
}

export const DatetimeFieldDiff: DiffComponent<StringDiff> = ({
  diff,
  schemaType,
}: DatetimeFieldDiffProps) => {
  return (
    <Box data-testid="datetime-field-diff">
      <DiffFromTo
        align="center"
        diff={diff}
        schemaType={schemaType}
        previewComponent={DatetimePreview}
      />
    </Box>
  )
}
