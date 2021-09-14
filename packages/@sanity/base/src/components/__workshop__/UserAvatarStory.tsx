import {Flex, Inline} from '@sanity/ui'
import React from 'react'
import {UserAvatar} from '../UserAvatar'

export default function UserAvatarStory() {
  return (
    <Flex align="center" height="fill" justify="center" padding={4} sizing="border">
      <Inline space={3}>
        <UserAvatar size={0} userId="me" />
        <UserAvatar size={1} userId="me" />
        <UserAvatar size={2} userId="me" />
      </Inline>
    </Flex>
  )
}
