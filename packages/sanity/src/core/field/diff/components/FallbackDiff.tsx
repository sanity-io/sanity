import React from 'react'
import {Box} from '@sanity/ui'
import {SanityPreview} from '../../../preview'
import {FieldPreviewComponent} from '../../preview'
import {Diff, DiffComponent} from '../../types'
import {DiffFromTo} from './DiffFromTo'

const FallbackPreview: FieldPreviewComponent<React.ReactNode> = ({value, schemaType}) => {
  return (
    <Box padding={2}>
      <SanityPreview schemaType={schemaType} value={value as any} layout="default" />
    </Box>
  )
}

export const FallbackDiff: DiffComponent<Diff<unknown, Record<string, unknown>>> = (props) => {
  const {diff, schemaType} = props

  return (
    <DiffFromTo
      diff={diff}
      schemaType={schemaType}
      previewComponent={FallbackPreview}
      layout="grid"
    />
  )
}
