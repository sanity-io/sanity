import React, {useState} from 'react'
import {useUser, useUserColor} from '@sanity/base/hooks'
import {User} from '../presence/types'
import Avatar from './Avatar'
import {Position, Size} from './types'

interface BaseProps {
  isAnimating?: boolean
  position?: Position
  animateArrowFrom?: Position
  size?: Size
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
  if (namesArray.length === 1) return `${namesArray[0].charAt(0)}`
  return `${namesArray[0].charAt(0)}${namesArray[namesArray.length - 1].charAt(0)}`
}

export function UserAvatar(props: Props) {
  return isLoaded(props) ? <StaticUserAvatar {...props} /> : <UserAvatarLoader {...props} />
}

function StaticUserAvatar({
  user,
  isAnimating,
  animateArrowFrom,
  position,
  size,
  tone
}: LoadedUserProps) {
  const [imageLoadError, setImageLoadError] = useState<null | Error>(null)
  const userColor = useUserColor(user.id)
  const imageUrl = imageLoadError ? null : user?.imageUrl
  return (
    <Avatar
      imageUrl={imageUrl}
      animateArrowFrom={animateArrowFrom}
      isAnimating={isAnimating}
      position={position}
      size={size}
      label={user?.displayName}
      borderColor={userColor.border}
      onImageLoadError={setImageLoadError}
      tone={tone}
    >
      {!imageUrl && user?.displayName && nameToInitials(user.displayName)}
    </Avatar>
  )
}

function UserAvatarLoader({userId, ...loadedProps}: UnloadedUserProps) {
  const {isLoading, error, value: user} = useUser(userId)
  if (isLoading || error) {
    // @todo How do we handle this?
    return null
  }

  return <UserAvatar {...loadedProps} user={user} />
}

function isLoaded(props: Props): props is LoadedUserProps {
  const loadedProps = props as LoadedUserProps
  return typeof loadedProps.user !== 'undefined' && typeof loadedProps.user.id === 'string'
}
