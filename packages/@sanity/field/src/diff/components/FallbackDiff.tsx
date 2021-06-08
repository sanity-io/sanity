import React from 'react'
import Preview from 'part:@sanity/base/preview'
import {Box} from '@sanity/ui'
import {PreviewComponent} from '../../preview/types'
import {Diff, DiffComponent} from '../../types'
import {DiffFromTo} from './DiffFromTo'

const FallbackPreview: PreviewComponent<React.ReactNode> = ({value, schemaType}) => {
  return (
    <Box padding={2}>
      <Preview type={schemaType} value={value} layout="default" />
    </Box>
  )
}

export const FallbackDiff: DiffComponent<Diff<unknown, Record<string, any>>> = ({
  diff,
  schemaType,
}) => {
  return (
    <DiffFromTo
      diff={diff}
      schemaType={schemaType}
      previewComponent={FallbackPreview}
      layout="grid"
    />
  )
}
