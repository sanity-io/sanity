import React from 'react'
import {UserAvatar, Props as UserAvatarProps} from '../avatar/UserAvatar'
import {Status} from './types'

export type Props = UserAvatarProps & {
  status?: Status
}

export default function PresenceUserAvatar({status = 'online', position, ...rest}: Props) {
  // Decide whether the avatar border should animate
  // const isAnimating = !position && status === 'editing'
  return <UserAvatar {...rest} position={position} status={status} />
}
