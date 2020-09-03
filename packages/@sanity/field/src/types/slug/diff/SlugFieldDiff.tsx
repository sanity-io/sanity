import React from 'react'
import {DiffComponent, ObjectDiff, Change} from '../../../diff'
import {SlugPreview} from '../preview'

interface Slug {
  current?: string
}

export const SlugFieldDiff: DiffComponent<ObjectDiff<Slug>> = ({diff, schemaType}) => {
  return <Change layout="grid" diff={diff} schemaType={schemaType} previewComponent={SlugPreview} />
}
