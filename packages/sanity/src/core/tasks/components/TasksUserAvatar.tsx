import {UserIcon} from '@sanity/icons'
import {type User} from '@sanity/types'
import {Text} from '@sanity/ui'
import {getVarName, vars} from '@sanity/ui/css'
import {type AvatarSize} from '@sanity/ui/theme'
import {css, styled} from 'styled-components'

import {Tooltip} from '../../../ui-components'
import {AvatarSkeleton, UserAvatar} from '../../components'
import {useUser} from '../../store'

const AvatarRoot = styled.div<{$size: AvatarSize; $border?: boolean; $removeBg?: boolean}>(
  (props) => {
    return css`
      min-height: ${vars.avatar.scale[props.$size].size};
      min-width: ${vars.avatar.scale[props.$size].size};
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      ${props.$border ? `box-shadow: inset 0 0 0 1px ${vars.color.border};` : ''};
      ${props.$removeBg ? `${getVarName(vars.color.avatar.gray.bg)}: transparent;` : ''}
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
