import {type AvatarSize} from '@sanity/ui'
// eslint-disable-next-line camelcase
import {getTheme_v2} from '@sanity/ui/theme'
import styled, {css} from 'styled-components'

export const AVATAR_HEIGHT = 25

const Spacer = styled.div<{$size: number}>((props) => {
  const theme = getTheme_v2(props.theme)

  return css`
    min-width: ${theme.avatar.sizes[props.$size]?.size}px;
  `
})

/**
 * This component is used to as a spacer in situations where we want to align
 * components without avatars with components that have avatars.
 */
export function SpacerAvatar({show = true, size = 1}: {show?: boolean; size?: AvatarSize}) {
  if (!show) {
    return null
  }
  return <Spacer $size={size} />
}
