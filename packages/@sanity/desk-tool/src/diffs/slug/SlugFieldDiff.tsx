import React from 'react'
import {DiffComponent, ObjectDiff, StringSchemaType} from '@sanity/field/diff'
import {StringFieldDiff} from '../string/StringFieldDiff'

interface Slug {
  current?: string
}

export const SlugFieldDiff: DiffComponent<ObjectDiff<Slug>> = ({diff, schemaType}) => {
  const currentField = schemaType.fields.find(field => field.name === 'current')
  const currentDiff = diff.fields.current
  if (!currentField || currentDiff?.type !== 'string') {
    return null
  }

  return <StringFieldDiff diff={currentDiff} schemaType={currentField as StringSchemaType} />
}
