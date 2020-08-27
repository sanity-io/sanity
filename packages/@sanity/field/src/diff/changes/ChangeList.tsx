import * as React from 'react'
import {ObjectDiff, ObjectSchemaType} from '../types'
import {buildDocumentChangeList} from './buildChangeList'
import {ChangeResolver} from './ChangeResolver'

interface Props {
  schemaType: ObjectSchemaType
  diff: ObjectDiff
  fields?: string[]
}

export function ChangeList({diff, fields, schemaType}: Props) {
  if (schemaType.jsonType !== 'object') {
    throw new Error(`Only object schema types are allowed in ChangeList`)
  }

  const changes = React.useMemo(() => buildDocumentChangeList(schemaType, diff), [
    schemaType,
    fields,
    diff
  ])

  return (
    <>
      {changes.map(change => (
        <ChangeResolver change={change} key={change.key} />
      ))}
    </>
  )
}
