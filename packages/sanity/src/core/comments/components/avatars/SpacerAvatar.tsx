import {type AvatarSize} from '@sanity/ui'
// eslint-disable-next-line camelcase
import {getTheme_v2} from '@sanity/ui/theme'
import {css, styled} from 'styled-components'

/**
 * This component is used to as a spacer in situations where we want to align
 * components without avatars with components that have avatars.
 */
export const SpacerAvatar = styled.div<{$size?: AvatarSize}>((props) => {
  const theme = getTheme_v2(props.theme)
  const {$size = 1} = props
  return css`
    min-width: ${theme.avatar.sizes[$size]?.size}px;
  `
})
