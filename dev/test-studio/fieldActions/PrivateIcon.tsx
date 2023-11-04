import {LockIcon} from '@sanity/icons'
import {Text, Tooltip} from '@sanity/ui'
import React from 'react'

export function PrivateIcon() {
  return (
    <Tooltip
      content={
        <Text size={1} style={{whiteSpace: 'nowrap'}}>
          Only visible to you
        </Text>
      }
      padding={2}
      placement="top"
      portal
    >
      <LockIcon />
    </Tooltip>
  )
}
