import {UserIcon} from '@sanity/icons'
import {type User} from '@sanity/types'
import {type AvatarSize, Text} from '@sanity/ui'
// eslint-disable-next-line camelcase
import {getTheme_v2} from '@sanity/ui/theme'
import {css, styled} from 'styled-components'

import {Tooltip} from '../../../ui-components'
import {AvatarSkeleton, UserAvatar} from '../../components'
import {useUser} from '../../store'

const AvatarRoot = styled.div<{$size: AvatarSize; $border?: boolean; $removeBg?: boolean}>(
  (props) => {
    const theme = getTheme_v2(props.theme)
    return css`
      min-height: ${theme.avatar.sizes[props.$size]?.size}px;
      min-width: ${theme.avatar.sizes[props.$size]?.size}px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      ${props.$border ? 'box-shadow: inset 0 0 0 1px var(--card-border-color);' : ''};
      ${props.$removeBg ? '--card-avatar-gray-bg-color: transparent;' : ''}
    `
  },
)

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
      <AvatarRoot $size={size} $border={border}>
        <Text size={size}>
          <UserIcon />
        </Text>
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
      <AvatarRoot $size={size} $removeBg={!!loadedUser?.imageUrl}>
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
