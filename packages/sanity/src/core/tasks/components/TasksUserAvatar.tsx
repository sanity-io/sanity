import {UserIcon} from '@sanity/icons/User'
import {type User} from '@sanity/types'
import {type AvatarSize, useTheme_v2 as useThemeV2} from '@sanity/ui'
import {clsx} from 'clsx'
import {type CSSProperties, type ReactNode} from 'react'
import {Icon} from 'ui5'

import {Tooltip} from '../../../ui-components/tooltip/Tooltip'
import {AvatarSkeleton, UserAvatar} from '../../components/userAvatar/UserAvatar'
import {useUser} from '../../store/user/hooks'
import {
  avatarRoot,
  avatarRootBorder,
  avatarRootRemoveBg,
  avatarSizeVar,
} from './TasksUserAvatar.css'

function AvatarRoot(props: {
  size: AvatarSize
  border?: boolean
  removeBg?: boolean
  children: ReactNode
}) {
  const {size, border, removeBg, children} = props
  const {avatar} = useThemeV2()

  return (
    <div
      className={clsx(avatarRoot, border && avatarRootBorder, removeBg && avatarRootRemoveBg)}
      style={{[avatarSizeVar]: `${avatar.sizes[size]?.size}px`} as CSSProperties}
    >
      {children}
    </div>
  )
}

export function TasksUserAvatar(props: {
  user?: User
  size?: AvatarSize
  border?: boolean
  withTooltip?: boolean
}) {
  const {user, size = 0, border = true} = props
  const [loadedUser, loading] = useUser(user?.id || '')

  if (loading) {
    return <AvatarSkeleton $size={size} animated />
  }

  if (!user || !loadedUser) {
    return (
      <AvatarRoot size={size} border={border}>
        <Icon icon={UserIcon} size={size} muted />
      </AvatarRoot>
    )
  }

  return (
    <Tooltip
      content={loadedUser.displayName}
      disabled={!props.withTooltip}
      portal
      fallbackPlacements={['top', 'top-start']}
      placement="top-end"
    >
      <AvatarRoot size={size} removeBg={!!loadedUser?.imageUrl}>
        <UserAvatar
          user={loadedUser}
          size={size}
          {...(loadedUser?.imageUrl ? {color: undefined} : {})}
          {...(props.withTooltip ? {title: null} : {})}
        />
      </AvatarRoot>
    </Tooltip>
  )
}
