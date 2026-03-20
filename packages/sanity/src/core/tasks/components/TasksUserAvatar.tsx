import {UserIcon} from '@sanity/icons'
import {type User} from '@sanity/types'
import {type AvatarSize, Text, useTheme_v2 as useThemeV2} from '@sanity/ui'
import {assignInlineVars} from '@vanilla-extract/dynamic'

import {Tooltip} from '../../../ui-components'
import {AvatarSkeleton, UserAvatar} from '../../components'
import {useUser} from '../../store'
import * as classes from './TasksUserAvatar.css'

export function TasksUserAvatar(props: {
  user?: User
  size?: AvatarSize
  border?: boolean
  withTooltip?: boolean
}) {
  const {user, size = 0, border = true} = props
  const [loadedUser, loading] = useUser(user?.id || '')
  const theme = useThemeV2()

  const sizeValue = theme.avatar.sizes[size]?.size ?? 0

  if (loading) {
    return <AvatarSkeleton $size={size} animated />
  }

  if (!user || !loadedUser) {
    return (
      <div
        className={`${classes.avatarRoot} ${border ? classes.avatarRootBorder : ''}`}
        style={assignInlineVars({[classes.sizeVar]: `${sizeValue}px`})}
      >
        <Text size={size}>
          <UserIcon />
        </Text>
      </div>
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
      <div
        className={`${classes.avatarRoot} ${loadedUser?.imageUrl ? classes.avatarRootRemoveBg : ''}`}
        style={assignInlineVars({[classes.sizeVar]: `${sizeValue}px`})}
      >
        <UserAvatar
          user={loadedUser}
          size={size}
          {...(loadedUser?.imageUrl ? {color: undefined} : {})}
          {...(props.withTooltip ? {title: null} : {})}
        />
      </div>
    </Tooltip>
  )
}
