import i18n from 'i18next'
import k from './../../i18n/keys'
import React from 'react'
import {UnpublishIcon} from '@sanity/icons'
import {Text, Tooltip} from '@sanity/ui'

export function NotPublishedStatus() {
  return (
    <Tooltip content={<>{i18n.t(k.NOT_PUBLISHED)}</>}>
      <Text muted>
        <UnpublishIcon />
      </Text>
    </Tooltip>
  )
}
