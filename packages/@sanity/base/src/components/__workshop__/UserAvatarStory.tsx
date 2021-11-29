import type {AvatarSize} from '@sanity/ui'
import {Flex} from '@sanity/ui'
import {useSelect} from '@sanity/ui-workshop'
import React from 'react'
import {UserAvatar} from '../UserAvatar'

const AVATAR_SIZE_OPTIONS: Record<string, AvatarSize> = {'0': 0, '1': 1, '2': 2}

export default function UserAvatarStory() {
  const size = useSelect('Size', AVATAR_SIZE_OPTIONS, 2)

  return (
    <Flex align="center" height="fill" justify="center" padding={4} sizing="border">
      <UserAvatar size={size} userId="me" />
    </Flex>
  )
}
