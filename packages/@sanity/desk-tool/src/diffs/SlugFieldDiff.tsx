import React from 'react'
import {ObjectDiff} from '@sanity/diff'
import {Annotation} from '../panes/documentPane/history/types'
import {DiffComponent} from './types'
import {StringFieldDiff} from './StringFieldDiff'

interface Slug {
  current?: string
}

export const SlugFieldDiff: DiffComponent<ObjectDiff<Annotation, Slug>> = ({diff, schemaType}) => {
  const currentType = schemaType.fields?.find(field => field.name === 'current')
  const currentDiff = diff.fields.current
  if (!currentDiff || !currentType) {
    return null
  }

  return <StringFieldDiff diff={currentDiff.diff} schemaType={currentType} />
}
