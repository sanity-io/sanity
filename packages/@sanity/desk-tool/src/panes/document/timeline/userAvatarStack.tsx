import {UserAvatar} from '@sanity/base/components'
import React from 'react'
import {AvatarStack, Card} from '@sanity/ui'
import styled from 'styled-components'

interface UserAvatarStackProps {
  maxLength?: number
  userIds: string[]
}

// This Card is added in order to get the correct color on avatar initials
const AvatarCard = styled(Card)`
  background: transparent;
`

export function UserAvatarStack({maxLength, userIds}: UserAvatarStackProps) {
  return (
    <AvatarStack maxLength={maxLength}>
      {userIds.map((userId) => (
        <AvatarCard key={userId}>
          <UserAvatar userId={userId} withTooltip />
        </AvatarCard>
      ))}
    </AvatarStack>
  )
}
