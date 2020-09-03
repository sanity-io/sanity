import * as React from 'react'
import {ObjectDiff, ObjectSchemaType, ChangeNode} from '../../types'
import {buildObjectChangeList} from './buildChangeList'
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

  const changes = React.useMemo(() => getFlatChangeList(schemaType, diff, fields), [
    schemaType,
    fields,
    diff
  ])

  if (changes.length === 0) {
    return null
  }

  return (
    <>
      {changes.map(change => (
        <ChangeResolver change={change} key={change.key} />
      ))}
    </>
  )
}

function getFlatChangeList(schemaType: ObjectSchemaType, diff: ObjectDiff, fields?: string[]) {
  if (fields && fields.length === 0) {
    return []
  }

  return maybeFlatten(buildObjectChangeList(schemaType, diff, [], [], {fieldFilter: fields}))
}

function maybeFlatten(changes: ChangeNode[]) {
  return changes.length === 1 && changes[0].type === 'group' && changes[0].path.length === 0
    ? changes[0].changes
    : changes
}
