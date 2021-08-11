import {Avatar, AvatarPosition, AvatarSize, AvatarStatus} from '@sanity/ui'
import React, {useState} from 'react'
import {User} from '../datastores/user/types'
import {useUser, useUserColor} from '../hooks'

type LegacyAvatarSize = 'small' | 'medium' | 'large'

interface BaseProps {
  position?: AvatarPosition
  animateArrowFrom?: AvatarPosition
  size?: LegacyAvatarSize | AvatarSize
  status?: AvatarStatus
  tone?: 'navbar'
}

export type Props = BaseProps & UserProps

interface LoadedUserProps extends BaseProps {
  user: User
}

interface UnloadedUserProps extends BaseProps {
  userId: string
}

type UserProps = LoadedUserProps | UnloadedUserProps

const symbols = /[^\p{Alpha}\p{White_Space}]/gu
const whitespace = /\p{White_Space}+/u

const LEGACY_TO_UI_AVATAR_SIZES: {[key: string]: AvatarSize | undefined} = {
  small: 0,
  medium: 1,
  large: 2,
}

function nameToInitials(fullName: string) {
  const namesArray = fullName.replace(symbols, '').split(whitespace)

  if (namesArray.length === 1) {
    return `${namesArray[0].charAt(0)}`.toUpperCase()
  }

  return `${namesArray[0].charAt(0)}${namesArray[namesArray.length - 1].charAt(0)}`
}

export function UserAvatar(props: Props) {
  if (isLoaded(props)) {
    return <StaticUserAvatar {...props} />
  }

  return <UserAvatarLoader {...props} />
}

function StaticUserAvatar({user, animateArrowFrom, position, size, status, tone}: LoadedUserProps) {
  const [imageLoadError, setImageLoadError] = useState<null | Error>(null)
  const userColor = useUserColor(user.id)
  const imageUrl = imageLoadError ? undefined : user?.imageUrl

  return (
    <Avatar
      animateArrowFrom={animateArrowFrom}
      arrowPosition={position}
      color={userColor.name}
      data-legacy-tone={tone}
      initials={user?.displayName && nameToInitials(user.displayName)}
      src={imageUrl}
      onImageLoadError={setImageLoadError}
      size={typeof size === 'string' ? LEGACY_TO_UI_AVATAR_SIZES[size] : size}
      status={status}
    />
  )
}

function UserAvatarLoader({userId, ...loadedProps}: UnloadedUserProps) {
  const {isLoading, error, value} = useUser(userId)

  if (isLoading || error || !value) {
    // @todo How do we handle this?
    return null
  }

  return <UserAvatar {...loadedProps} user={value} />
}

function isLoaded(props: Props): props is LoadedUserProps {
  const loadedProps = props as LoadedUserProps

  return typeof loadedProps.user !== 'undefined' && typeof loadedProps.user.id === 'string'
}
