import {type User} from '@sanity/types'
import {
  Avatar,
  type AvatarPosition,
  type AvatarProps,
  type AvatarSize,
  type AvatarStatus,
  Skeleton,
} from '@sanity/ui'
// eslint-disable-next-line camelcase
import {getTheme_v2} from '@sanity/ui/theme'
import {type ForwardedRef, forwardRef, useState} from 'react'
import {css, styled} from 'styled-components'

import {Tooltip} from '../../../ui-components'
import {useUser} from '../../store'
import {useUserColor} from '../../user-color'
import {isRecord} from '../../util'

interface AvatarSkeletonProps {
  $size?: AvatarSize
}

/**
 * A loading skeleton element representing a user avatar
 * @beta
 */
export const AvatarSkeleton = styled(Skeleton)<AvatarSkeletonProps>((props) => {
  const theme = getTheme_v2(props.theme)
  const size = props.$size ?? 1
  return css`
    border-radius: 50%;
    width: ${theme.avatar.sizes[size].size}px;
    height: ${theme.avatar.sizes[size].size}px;
  `
})

/**
 * @hidden
 * @beta */
export interface UserAvatarProps {
  __unstable_hideInnerStroke?: AvatarProps['__unstable_hideInnerStroke']
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

/**
 * @hidden
 * @beta */
export function UserAvatar(props: UserAvatarProps) {
  const {user, withTooltip, ...restProps} = props

  if (isRecord(user)) {
    if (withTooltip) {
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
    <Tooltip content={displayName} placement="top" portal>
      <div style={{display: 'inline-block'}}>
        <StaticUserAvatar {...props} />
      </div>
    </Tooltip>
  )
}

const StaticUserAvatar = forwardRef(function StaticUserAvatar(
  props: Omit<UserAvatarProps, 'user'> & {user: User},
  ref: ForwardedRef<HTMLDivElement>,
) {
  const {user, animateArrowFrom, position, size, status, tone, ...restProps} = props
  const [imageLoadError, setImageLoadError] = useState<null | Error>(null)
  const userColor = useUserColor(user.id)
  const imageUrl = imageLoadError ? undefined : user?.imageUrl

  return (
    <Avatar
      __unstable_hideInnerStroke
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
      title={user?.displayName}
      {...restProps}
    />
  )
})

function UserAvatarLoader({user, ...loadedProps}: Omit<UserAvatarProps, 'user'> & {user: string}) {
  const [value, loading] = useUser(user)

  if (loading) {
    return <AvatarSkeleton $size={loadedProps.size} animated />
  }
  if (!value) {
    return <AvatarSkeleton $size={loadedProps.size} animated={false} />
  }

  return <UserAvatar {...loadedProps} user={value} />
}
