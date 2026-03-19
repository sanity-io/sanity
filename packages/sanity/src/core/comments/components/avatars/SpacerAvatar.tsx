import {type AvatarSize, useTheme_v2 as useThemeV2} from '@sanity/ui'
import {assignInlineVars} from '@vanilla-extract/dynamic'

import {minWidthVar, spacerAvatar} from './SpacerAvatar.css'

interface SpacerAvatarProps {
  $size?: AvatarSize
}

/**
 * This component is used to as a spacer in situations where we want to align
 * components without avatars with components that have avatars.
 */
export function SpacerAvatar(props: SpacerAvatarProps) {
  const {$size = 1} = props
  const theme = useThemeV2()

  return (
    <div
      className={spacerAvatar}
      style={assignInlineVars({
        [minWidthVar]: `${theme.avatar.sizes[$size]?.size}px`,
      })}
    />
  )
}
