import React from 'react'
import {ArrayItemError} from '../../../store/types/memberErrors'
import {ItemWithMissingType} from './item/ItemWithMissingType'

export function MemberError(props: {member: ArrayItemError}) {
  const {member} = props

  if (member.error.type === 'INVALID_ITEM_TYPE') {
    return <ItemWithMissingType value={member.error.value} />
  }
  return <div>Unexpected Error: {member.error.type}</div>
}
