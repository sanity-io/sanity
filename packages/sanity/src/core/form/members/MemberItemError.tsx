import React from 'react'
import {ItemWithMissingType} from '../inputs/arrays/ArrayOfObjectsInput/item/ItemWithMissingType'
import {ArrayItemError} from '../store/types/memberErrors'

export function MemberItemError(props: {member: ArrayItemError}) {
  const {member} = props

  if (member.error.type === 'INVALID_ITEM_TYPE') {
    return <ItemWithMissingType value={member.error.value} />
  }
  return <div>Unexpected Error: {member.error.type}</div>
}
