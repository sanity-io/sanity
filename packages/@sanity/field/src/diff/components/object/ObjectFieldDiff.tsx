import React from 'react'
import {DiffComponent, ObjectDiff} from '../../types'
import {ChangeList} from '../../changes'

export const ObjectFieldDiff: DiffComponent<ObjectDiff> = ({diff, schemaType}) => {
  return <ChangeList diff={diff} schemaType={schemaType} />
}
