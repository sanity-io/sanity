import {vars} from '@sanity/ui/css'
import {type AvatarSize} from '@sanity/ui/theme'
import {css, styled} from 'styled-components'

/**
 * This component is used to as a spacer in situations where we want to align
 * components without avatars with components that have avatars.
 */
export const SpacerAvatar = styled.div<{$size?: AvatarSize}>((props) => {
  const {$size = 1} = props
  return css`
    min-width: ${vars.avatar.scale[$size].size};
  `
})
