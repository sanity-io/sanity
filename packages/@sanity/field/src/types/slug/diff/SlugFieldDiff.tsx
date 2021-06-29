import React from 'react'
import {DiffComponent, DiffFromTo, ObjectDiff} from '../../../diff'
import {SlugPreview} from '../preview'

interface Slug {
  current?: string
}

export const SlugFieldDiff: DiffComponent<ObjectDiff<Slug>> = ({diff, schemaType}) => {
  return (
    <DiffFromTo
      layout="inline"
      diff={diff}
      schemaType={schemaType}
      previewComponent={SlugPreview}
    />
  )
}
