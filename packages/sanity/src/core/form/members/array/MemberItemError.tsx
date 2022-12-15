import i18n from 'i18next'
import k from './../../../../i18n/keys'
import React from 'react'

import {ArrayItemError} from '../../store/types/memberErrors'
import {IncompatibleItemType} from './IncompatibleItemType'

/** @internal */
export function MemberItemError(props: {member: ArrayItemError}) {
  const {member} = props

  if (member.error.type === 'INVALID_ITEM_TYPE') {
    return <IncompatibleItemType value={member.error.value} />
  }
  return (
    <div>
      {i18n.t(k.UNEXPECTED_ERROR)} {member.error.type}
    </div>
  )
}
