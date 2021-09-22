// @todo: remove the following line when part imports has been removed from this file
///<reference types="@sanity/types/parts" />

import {UserAvatar} from '@sanity/base/components'
import React from 'react'
import {AvatarStack} from '@sanity/ui'

interface UserAvatarStackProps {
  maxLength?: number
  userIds: string[]
}

export function UserAvatarStack({maxLength, userIds}: UserAvatarStackProps) {
  return (
    <AvatarStack maxLength={maxLength}>
      {userIds.map((userId) => (
        <UserAvatar key={userId} userId={userId} />
      ))}
    </AvatarStack>
  )
}
