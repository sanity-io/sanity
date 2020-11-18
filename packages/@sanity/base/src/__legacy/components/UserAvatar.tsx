/* eslint-disable react/require-default-props */

import React, {useState} from 'react'
import {Avatar, AvatarPosition, AvatarSize, AvatarStatus} from 'part:@sanity/components/avatar'
import {User} from '../datastores/user/types'
import {useUser, useUserColor} from '../hooks'

interface BaseProps {
  position?: AvatarPosition
  animateArrowFrom?: AvatarPosition
  size?: AvatarSize
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

function nameToInitials(fullName: string) {
  const namesArray = fullName.split(' ')

  if (namesArray.length === 1) {
    return `${namesArray[0].charAt(0)}`
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
      color={{
        dark: userColor.tints[400].hex,
        light: userColor.tints[500].hex,
      }}
      initials={user?.displayName && nameToInitials(user.displayName)}
      src={imageUrl}
      onImageLoadError={setImageLoadError}
      size={size}
      status={status}
      title={user?.displayName}
      tone={tone}
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
