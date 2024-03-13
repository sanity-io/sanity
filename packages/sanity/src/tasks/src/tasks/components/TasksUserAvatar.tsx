import {UserIcon} from '@sanity/icons'
import {type AvatarSize, Skeleton, Text} from '@sanity/ui'
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

const AvatarSkeleton = styled(Skeleton)<{$size: AvatarSize}>((props) => {
  const theme = getTheme_v2(props.theme)

  return css`
    height: ${theme.avatar.sizes[props.$size]?.size}px;
    width: ${theme.avatar.sizes[props.$size]?.size}px;
    border-radius: 50%;
  `
})

function NoUserAvatar(props: {size: AvatarSize; border: boolean}) {
  const {size, border} = props
  return (
    <AvatarRoot $size={size} $border={border}>
      <Text size={size}>
        <UserIcon />
      </Text>
    </AvatarRoot>
  )
}

function Avatar(props: {userId: string; size: AvatarSize; border: boolean}) {
  const {userId, size, border} = props
  const [loadedUser, loading] = useUser(userId)

  if (loading) {
    return <AvatarSkeleton $size={size} animated />
  }
  if (!loadedUser) {
    return <NoUserAvatar size={size} border={border} />
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

export function TasksUserAvatar(props: {user?: User; size?: AvatarSize; border?: boolean}) {
  const {user, size = 0, border = true} = props

  if (!user?.id) {
    return <NoUserAvatar size={size} border={border} />
  }
  return <Avatar userId={user.id} size={size} border={border} />
}
