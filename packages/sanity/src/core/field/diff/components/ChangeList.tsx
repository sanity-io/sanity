import React from 'react'
import {ObjectSchemaType} from '@sanity/types'
import {ObjectDiff} from '../../types'
import {ObjectFieldDiff} from '../../types/object/diff'

/** @internal */
export interface ChangeListProps {
  schemaType: ObjectSchemaType
  diff: ObjectDiff
  fields?: string[]
}

/** @internal */
export function ChangeList({diff, fields, schemaType}: ChangeListProps): React.ReactElement | null {
  return <ObjectFieldDiff diff={diff} schemaType={schemaType} fields={fields} />
}
