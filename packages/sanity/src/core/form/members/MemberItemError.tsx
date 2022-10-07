import React from 'react'
import {IncompatibleItemType} from '../inputs/arrays/ArrayOfObjectsInput/item/IncompatibleItemType'
import {ArrayItemError} from '../store/types/memberErrors'

/** @internal */
export function MemberItemError(props: {member: ArrayItemError}) {
  const {member} = props

  if (member.error.type === 'INVALID_ITEM_TYPE') {
    return <IncompatibleItemType value={member.error.value} />
  }
  return <div>Unexpected Error: {member.error.type}</div>
}
