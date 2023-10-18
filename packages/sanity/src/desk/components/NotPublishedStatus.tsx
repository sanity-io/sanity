import React from 'react'
import {UnpublishIcon} from '@sanity/icons'
import {Text} from '@sanity/ui'
import {Tooltip} from '../../ui'

export function NotPublishedStatus() {
  return (
    <Tooltip text="Not published">
      <Text muted>
        <UnpublishIcon aria-label="Not published" />
      </Text>
    </Tooltip>
  )
}
