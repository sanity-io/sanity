import React from 'react'

import {ArrayItemError} from '../../store/types/memberErrors'
import {IncompatibleItemType} from './IncompatibleItemType'

/** @internal */
export function MemberItemError(props: {member: ArrayItemError}) {
  const {member} = props

  if (member.error.type === 'INVALID_ITEM_TYPE') {
    return <IncompatibleItemType value={member.error.value} />
  }
  return <div>Unexpected Error: {member.error.type}</div>
}
