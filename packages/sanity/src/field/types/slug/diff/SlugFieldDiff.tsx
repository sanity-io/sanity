import {SlugSchemaType} from '@sanity/types'
import {Box} from '@sanity/ui'
import React from 'react'
import {DiffFromTo} from '../../../diff'
import {DiffComponent, ObjectDiff} from '../../../types'
import {SlugPreview} from '../preview'

interface Slug {
  current?: string
}

export interface SlugFieldDiffProps {
  diff: ObjectDiff<Slug>
  schemaType: SlugSchemaType
}

export const SlugFieldDiff: DiffComponent<ObjectDiff<Slug>> = ({
  diff,
  schemaType,
}: SlugFieldDiffProps) => {
  return (
    <Box data-testid="slug-field-diff">
      <DiffFromTo
        layout="inline"
        diff={diff}
        schemaType={schemaType}
        previewComponent={SlugPreview}
      />
    </Box>
  )
}
