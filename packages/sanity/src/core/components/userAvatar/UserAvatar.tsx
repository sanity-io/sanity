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
import {type RefAttributes, Suspense, use, useMemo} from 'react'
import {type ObservablePromise, useObservablePromise} from 'react-rx'
import {catchError, type Observable, of} from 'rxjs'
import {css, styled} from 'styled-components'

import {Tooltip} from '../../../ui-components/tooltip/Tooltip'
import {useUserStore} from '../../store/datastores'
import {useCurrentUser} from '../../store/user/hooks'
import {getUserFromCurrentUser, type UserStore} from '../../store/user/userStore'
import {useUserColor} from '../../user-color/hooks'
import {createObservableCache} from '../../util/createObservableCache'
import {isRecord} from '../../util/isRecord'

interface AvatarSkeletonProps {
  $size?: AvatarSize
}

/**
 * A loading skeleton element representing a user avatar
 * @internal
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
  // Untyped callers still pass legacy string sizes, which neither `Avatar` nor the skeletons take
  const size = typeof props.size === 'string' ? LEGACY_TO_UI_AVATAR_SIZES[props.size] : props.size

  if (isRecord(user)) {
    if (withTooltip) {
      return <TooltipUserAvatar {...restProps} size={size} user={user as User} />
    }

    return <StaticUserAvatar {...restProps} size={size} user={user as User} />
  }

  return <UserAvatarLoader {...props} size={size} user={user as string} />
}

function TooltipUserAvatar(props: Omit<UserAvatarProps, 'user'> & {user: User}) {
  const {
    user: {displayName},
  } = props

  // `Avatar` also renders its `title` as a native browser tooltip, so the wrapper carries the name
  return (
    <Tooltip content={displayName} placement="top" portal>
      <div role="img" aria-label={displayName} style={{display: 'inline-block'}}>
        <StaticUserAvatar {...props} hideTitle />
      </div>
    </Tooltip>
  )
}

function StaticUserAvatar(
  props: Omit<UserAvatarProps, 'user'> & {
    user: User
    hideTitle?: boolean
  } & RefAttributes<HTMLDivElement>,
) {
  const {ref, user, animateArrowFrom, hideTitle, position, size, status, tone, ...restProps} = props
  const userColor = useUserColor(user.id)

  return (
    // React can suspend on the `<img>` that `Avatar` renders until the image has loaded
    <Suspense fallback={<AvatarSkeleton $size={size} animated />}>
      <Avatar
        __unstable_hideInnerStroke
        animateArrowFrom={animateArrowFrom}
        arrowPosition={position}
        color={userColor.name}
        data-legacy-tone={tone}
        initials={user?.displayName && nameToInitials(user.displayName)}
        src={user?.imageUrl}
        ref={ref}
        size={size}
        status={status}
        title={hideTitle ? undefined : user?.displayName}
        {...restProps}
      />
    </Suspense>
  )
}

// react-rx keeps one settled promise per observable, so every avatar for a user shares one
// observable. The cache keeps a user while anything subscribes to it, and react-rx stays
// subscribed while an avatar for the user is mounted and for `USER_TTL` after the last one
// unmounts: avatars mounting in that time render without suspending.
const USER_TTL = 5 * 60_000
const userCaches = new WeakMap<UserStore, (userId: string) => Observable<User | null>>()
// The cache drops a lookup that errors, so the next avatar for that user looks it up again. The
// error becomes `null` (a placeholder) after the cache, memoized per cached observable so avatars
// for the same user keep sharing one react-rx promise
const avatarUsers = new WeakMap<Observable<User | null>, Observable<User | null>>()

function observeUser(userStore: UserStore, userId: string): Observable<User | null> {
  let cache = userCaches.get(userStore)
  if (!cache) {
    cache = createObservableCache((id) => userStore.getUser(id), {ttl: USER_TTL})
    userCaches.set(userStore, cache)
  }
  const user$ = cache(userId)
  let avatarUser$ = avatarUsers.get(user$)
  if (!avatarUser$) {
    avatarUser$ = user$.pipe(
      catchError((err) => {
        console.error(err)
        return of(null)
      }),
    )
    avatarUsers.set(user$, avatarUser$)
  }
  return avatarUser$
}

function UserAvatarLoader({user, ...loadedProps}: Omit<UserAvatarProps, 'user'> & {user: string}) {
  const currentUser = useCurrentUser()

  // The signed-in user is resolved before the studio renders, and the user store answers `me`
  // and the user's own id from that same record. Rendering it from here, rather than asking the
  // store and suspending on its answer, paints the user's own avatar (the navbar's user menu)
  // together with its surroundings instead of a skeleton first.
  if (currentUser && (user === 'me' || user === currentUser.id)) {
    return <UserAvatar {...loadedProps} user={getUserFromCurrentUser(currentUser)} />
  }

  return <RemoteUserAvatar {...loadedProps} user={user} />
}

function RemoteUserAvatar({user, ...loadedProps}: Omit<UserAvatarProps, 'user'> & {user: string}) {
  const userStore = useUserStore()
  const observable = useMemo(() => observeUser(userStore, user), [userStore, user])
  // Read with `use()` below the boundary, never here: the lookup starts when this component commits
  const promise = useObservablePromise(observable, {ttl: USER_TTL})

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
