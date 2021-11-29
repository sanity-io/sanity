import React from 'react'
import type {DiffComponent, ObjectDiff} from '../../../diff'
import {ChangeList} from '../../../diff'

export const ObjectFieldDiff: DiffComponent<ObjectDiff> = ({diff, schemaType}) => {
  return <ChangeList diff={diff} schemaType={schemaType} />
}
