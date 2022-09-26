import React from 'react'
import {ChangeList} from '../../../diff'
import {DiffComponent, ObjectDiff} from '../../../types'

export const ObjectFieldDiff: DiffComponent<ObjectDiff> = ({diff, schemaType}) => {
  return <ChangeList diff={diff} schemaType={schemaType} />
}
