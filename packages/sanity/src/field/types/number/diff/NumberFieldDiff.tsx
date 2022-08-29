import {NumberSchemaType} from '@sanity/types'
import {Box} from '@sanity/ui'
import React from 'react'
import {DiffFromTo} from '../../../diff'
import {DiffComponent, NumberDiff} from '../../../types'
import {NumberPreview} from '../preview/NumberPreview'

export interface NumberFieldDiffProps {
  diff: NumberDiff
  schemaType: NumberSchemaType
}

export const NumberFieldDiff: DiffComponent<NumberDiff> = ({
  diff,
  schemaType,
}: NumberFieldDiffProps) => {
  return (
    <Box data-testid="number-field-diff">
      <DiffFromTo
        diff={diff}
        layout="inline"
        previewComponent={NumberPreview}
        schemaType={schemaType}
      />
    </Box>
  )
}
