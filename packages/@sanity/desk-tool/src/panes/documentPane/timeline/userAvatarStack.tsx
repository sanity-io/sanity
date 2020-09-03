import {UserAvatar} from '@sanity/base/components'
import React from 'react'
import {AvatarStack} from './avatarStack'

interface UserAvatarStackProps {
  maxLength?: number
  userIds: string[]
}

export function UserAvatarStack({maxLength, userIds}: UserAvatarStackProps) {
  return (
    <AvatarStack maxLength={maxLength}>
      {userIds.map(userId => (
        <UserAvatar key={userId} userId={userId} />
      ))}
    </AvatarStack>
  )
}
