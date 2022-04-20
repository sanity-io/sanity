import {AvatarSize, Flex} from '@sanity/ui'
import {useBoolean, useSelect} from '@sanity/ui-workshop'
import React from 'react'
import {UserAvatar} from '../UserAvatar'

const SIZE_OPTIONS: Record<string, AvatarSize> = {
  '0': 0,
  '1': 1,
  '2': 2,
}

export default function UserAvatarStory() {
  const size = useSelect('Size', SIZE_OPTIONS, 0)
  const withTooltip = useBoolean('With tooltip')

  return (
    <Flex align="center" height="fill" justify="center" padding={4}>
      <UserAvatar size={size} user="me" withTooltip={withTooltip} />
    </Flex>
  )
}
