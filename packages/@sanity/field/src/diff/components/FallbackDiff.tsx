// @todo: remove the following line when part imports has been removed from this file
///<reference types="@sanity/types/parts" />

import React from 'react'
import Preview from 'part:@sanity/base/preview'
import {Box} from '@sanity/ui'
import type {PreviewComponent} from '../../preview/types'
import type {Diff, DiffComponent} from '../../types'
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
