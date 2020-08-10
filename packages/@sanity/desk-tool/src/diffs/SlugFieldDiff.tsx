import React from 'react'
import {ObjectDiff, StringDiff} from '@sanity/diff'
import {Annotation} from '../panes/documentPane/history/types'
import {DiffComponent, SchemaType} from './types'
import {StringFieldDiff} from './StringFieldDiff'

interface Slug {
  current?: string
}

export const SlugFieldDiff: DiffComponent<ObjectDiff<Annotation, Slug>> = ({diff, schemaType}) => {
  const currentField = schemaType.fields?.find(field => field.name === 'current')
  const currentDiff = diff.fields.current
  if (!currentField || currentDiff?.type !== 'changed' || currentDiff.diff?.type !== 'string') {
    return null
  }

  return (
    <StringFieldDiff
      diff={currentDiff.diff}
      schemaType={currentField as SchemaType<StringDiff<Annotation>>}
    />
  )
}
