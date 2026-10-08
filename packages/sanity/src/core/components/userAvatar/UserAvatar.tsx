import {type User} from '@sanity/types'
import {
  Avatar,
  type AvatarPosition,
  type AvatarProps,
  type AvatarSize,
  type AvatarStatus,
  Skeleton,
} from '@sanity/ui'
import {getTheme_v2} from '@sanity/ui/theme'
import {type RefAttributes, Suspense, use, useMemo, useState} from 'react'
import {type ObservablePromise, useObservablePromise} from 'react-rx'
import {defer, from} from 'rxjs'
import {css, styled} from 'styled-components'

import {Tooltip} from '../../../ui-components/tooltip/Tooltip'
import {useUserStore} from '../../store/datastores'
import {useUserColor} from '../../user-color/hooks'
import {isRecord} from '../../util/isRecord'

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

function StaticUserAvatar(
  props: Omit<UserAvatarProps, 'user'> & {user: User} & RefAttributes<HTMLDivElement>,
) {
  const {ref, user, animateArrowFrom, position, size, status, tone, ...restProps} = props
  // Keyed by URL rather than a plain flag: this component instance is reused when the user
  // changes, and a failure for the previous user must not suppress the next user's image
  const [failedImageUrl, setFailedImageUrl] = useState<string | undefined>(undefined)
  const userColor = useUserColor(user.id)
  const imageUrl = user?.imageUrl === failedImageUrl ? undefined : user?.imageUrl
  const avatarSize = typeof size === 'string' ? LEGACY_TO_UI_AVATAR_SIZES[size] : size

  return (
    // React can suspend on the `<img>` that `Avatar` renders until the image has loaded
    <Suspense fallback={<AvatarSkeleton $size={avatarSize} animated />}>
      <Avatar
        __unstable_hideInnerStroke
        animateArrowFrom={animateArrowFrom}
        arrowPosition={position}
        color={userColor.name}
        data-legacy-tone={tone}
        initials={user?.displayName && nameToInitials(user.displayName)}
        src={imageUrl}
        onImageLoadError={() => setFailedImageUrl(user?.imageUrl)}
        ref={ref}
        size={avatarSize}
        status={status}
        title={user?.displayName}
        {...restProps}
      />
    </Suspense>
  )
}

function UserAvatarLoader({user, ...loadedProps}: Omit<UserAvatarProps, 'user'> & {user: string}) {
  const userStore = useUserStore()
  const observable = useMemo(
    () =>
      defer(() =>
        from(
          userStore.getUser(user).catch((err) => {
            console.error(err)
            return null
          }),
        ),
      ),
    [userStore, user],
  )
  // Read with `use()` below the boundary, never here: the lookup starts when this component commits
  const promise = useObservablePromise(observable)

  return (
    <Suspense fallback={<AvatarSkeleton $size={loadedProps.size} animated />}>
      <UserAvatarLoaderResolver {...loadedProps} promise={promise} />
    </Suspense>
  )
}

function UserAvatarLoaderResolver({
  promise,
  ...loadedProps
}: Omit<UserAvatarProps, 'user'> & {promise: ObservablePromise<User | null>}) {
  const user = use(promise)

  if (!user) {
    return <AvatarSkeleton $size={loadedProps.size} animated={false} />
  }

  return <UserAvatar {...loadedProps} user={user} />
}
