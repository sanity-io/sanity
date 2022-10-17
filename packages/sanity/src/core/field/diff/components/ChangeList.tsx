import {ObjectSchemaType} from '@sanity/types'
import React from 'react'
import {ObjectDiff} from '../../types'
import {ObjectFieldDiff} from '../../types/object/diff'

interface ChangeListProps {
  diff: ObjectDiff
  schemaType: ObjectSchemaType
  fields?: string[]
}

/** @internal */
export function ChangeList(props: ChangeListProps) {
  const {diff, fields, schemaType} = props

  return <ObjectFieldDiff diff={diff} fields={fields} schemaType={schemaType} />
}
