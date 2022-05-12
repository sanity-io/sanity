import React from 'react'
import {AvatarStack} from '@sanity/ui'
import {UserAvatar} from '../../../../components/UserAvatar'

interface UserAvatarStackProps {
  maxLength?: number
  userIds: string[]
}

export function UserAvatarStack({maxLength, userIds}: UserAvatarStackProps) {
  return (
    <AvatarStack maxLength={maxLength}>
      {userIds.map((userId) => (
        <UserAvatar key={userId} user={userId} withTooltip />
      ))}
    </AvatarStack>
  )
}
