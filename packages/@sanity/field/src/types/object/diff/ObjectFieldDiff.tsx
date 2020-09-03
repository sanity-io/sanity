import React from 'react'
import {DiffComponent, ObjectDiff, ChangeList} from '../../../diff'

export const ObjectFieldDiff: DiffComponent<ObjectDiff> = ({diff, schemaType}) => {
  return <ChangeList diff={diff} schemaType={schemaType} />
}
