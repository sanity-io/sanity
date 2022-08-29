import {ObjectSchemaType} from '@sanity/types'
import {Box} from '@sanity/ui'
import React from 'react'
import {DiffFromTo} from '../../../diff'
import {DiffComponent, ReferenceDiff} from '../../../types'
import {ReferencePreview} from '../preview/ReferencePreview'

export interface ReferenceFieldDiffProps {
  diff: ReferenceDiff
  schemaType: ObjectSchemaType
}

export const ReferenceFieldDiff: DiffComponent<ReferenceDiff> = ({
  diff,
  schemaType,
}: ReferenceFieldDiffProps) => {
  return (
    <Box data-testid="reference-field-diff">
      <DiffFromTo
        align="center"
        diff={diff}
        layout="grid"
        path="_ref"
        previewComponent={ReferencePreview}
        schemaType={schemaType}
      />
    </Box>
  )
}
