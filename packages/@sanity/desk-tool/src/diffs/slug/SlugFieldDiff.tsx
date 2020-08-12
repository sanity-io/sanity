import React from 'react'
import {ObjectDiff, StringDiff} from '@sanity/diff'
import {Annotation} from '../../panes/documentPane/history/types'
import {DiffComponent, SchemaType} from '../types'
import {StringFieldDiff} from '../string/StringFieldDiff'

interface Slug {
  current?: string
}

export const SlugFieldDiff: DiffComponent<ObjectDiff<Annotation>> = ({diff, schemaType}) => {
  const currentField = schemaType.fields?.find(field => field.name === 'current')
  const currentDiff = diff.fields.current
  if (!currentField || currentDiff?.type !== 'string') {
    return null
  }

  return (
    <StringFieldDiff
      diff={currentDiff}
      schemaType={currentField as SchemaType<StringDiff<Annotation>>}
    />
  )
}
