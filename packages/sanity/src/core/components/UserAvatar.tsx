import {Avatar, AvatarPosition, AvatarSize, AvatarStatus, Box, Text, Tooltip} from '@sanity/ui'
import React, {forwardRef, useState} from 'react'
import type {User} from '@sanity/types'
import {useUser} from '../store'
import {isRecord} from '../util'
import {useUserColor} from '../user-color'

/** @beta */
export interface UserAvatarProps {
  animateArrowFrom?: AvatarPosition
  position?: AvatarPosition
  size?: AvatarSize
  status?: AvatarStatus
  tone?: 'navbar'
  user: User | string
  withTooltip?: boolean
}

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

/** @beta */
export function UserAvatar(props: UserAvatarProps) {
  const {user, ...restProps} = props

  if (isRecord(user)) {
    if (restProps.withTooltip) {
      return <TooltipUserAvatar {...restProps} user={user as User} />
    }

    return <StaticUserAvatar {...restProps} user={user as User} />
  }

  return <UserAvatarLoader {...props} user={user as string} />
}

function TooltipUserAvatar(props: Omit<UserAvatarProps, 'user'> & {user: User}) {
  const {
    user: {displayName},
  } = props

  return (
    <Tooltip
      content={
        <Box padding={2}>
          <Text size={1}>{displayName}</Text>
        </Box>
      }
      placement="top"
      portal
    >
      <div style={{display: 'inline-block'}}>
        <StaticUserAvatar {...props} />
      </div>
    </Tooltip>
  )
}

const StaticUserAvatar = forwardRef(function StaticUserAvatar(
  props: Omit<UserAvatarProps, 'user'> & {user: User},
  ref: React.ForwardedRef<HTMLDivElement>
) {
  const {user, animateArrowFrom, position, size, status, tone} = props
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
      ref={ref}
      size={typeof size === 'string' ? LEGACY_TO_UI_AVATAR_SIZES[size] : size}
      status={status}
    />
  )
})

function UserAvatarLoader({user, ...loadedProps}: Omit<UserAvatarProps, 'user'> & {user: string}) {
  const [value] = useUser(user)

  if (!value) {
    // @todo How do we handle this?
    return null
  }

  return <UserAvatar {...loadedProps} user={value} />
}
