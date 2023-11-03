import {LockIcon} from '@sanity/icons'
import React from 'react'
import {Tooltip} from '../../../packages/sanity/src/ui'

export function PrivateIcon() {
  return (
    <Tooltip content={'Only visible to you'} placement="top" portal>
      <LockIcon />
    </Tooltip>
  )
}
