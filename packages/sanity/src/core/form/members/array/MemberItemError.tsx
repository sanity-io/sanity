import React from 'react'

import {ArrayItemError} from '../../store/types/memberErrors'
import {useTranslation} from '../../../i18n'
import {IncompatibleItemType} from './IncompatibleItemType'

/** @internal */
export function MemberItemError(props: {member: ArrayItemError}) {
  const {member} = props
  const {t} = useTranslation()

  if (member.error.type === 'INVALID_ITEM_TYPE') {
    return <IncompatibleItemType value={member.error.value} />
  }
  return <div>{t('inputs.array.error.unexpected-error', {error: member.error.type})}</div>
}
