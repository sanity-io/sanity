import {type AvatarSize, AvatarStack} from '@sanity/ui-v3'
import {UserAvatar} from 'sanity'

interface UserAvatarStackProps {
  maxLength?: number
  userIds: string[]
  size?: AvatarSize
  withTooltip?: boolean
}

export function UserAvatarStack({
  maxLength,
  userIds,
  size,
  withTooltip = true,
}: UserAvatarStackProps) {
  return (
    <AvatarStack maxLength={maxLength} size={size}>
      {userIds.map((userId) => (
        <UserAvatar key={userId} user={userId} withTooltip={withTooltip} />
      ))}
    </AvatarStack>
  )
}
