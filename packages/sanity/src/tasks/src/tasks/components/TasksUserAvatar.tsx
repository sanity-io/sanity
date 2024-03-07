import {UserIcon} from '@sanity/icons'
import {type AvatarSize, Text} from '@sanity/ui'
// eslint-disable-next-line camelcase
import {getTheme_v2} from '@sanity/ui/theme'
import {type User, UserAvatar, useUser} from 'sanity'
import styled, {css} from 'styled-components'

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

export function TasksUserAvatar(props: {user?: User; size?: AvatarSize; border?: boolean}) {
  const {user, size = 0, border = true} = props
  const [loadedUser] = useUser(user?.id || '')

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
    <AvatarRoot $size={size} $removeBg={!!loadedUser?.imageUrl}>
      <UserAvatar
        user={loadedUser}
        size={size}
        {...(loadedUser?.imageUrl ? {color: undefined} : {})}
      />
    </AvatarRoot>
  )
}
