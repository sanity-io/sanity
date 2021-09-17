import React from 'react'
import {UnpublishIcon} from '@sanity/icons'
import {Text, Tooltip} from '@sanity/ui'

export function NotPublishedStatus() {
  return (
    <Tooltip content={<>Not published</>}>
      <Text muted>
        <UnpublishIcon />
      </Text>
    </Tooltip>
  )
}
