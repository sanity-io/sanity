import {type AvatarSize, useTheme_v2 as useThemeV2} from '@sanity/ui'
import {assignInlineVars} from '@vanilla-extract/dynamic'
import {clsx} from 'clsx'
import {type ComponentProps} from 'react'

import {avatarSizeVar, spacerAvatar} from './SpacerAvatar.css'

/**
 * This component is used to as a spacer in situations where we want to align
 * components without avatars with components that have avatars.
 */
export function SpacerAvatar(props: ComponentProps<'div'> & {$size?: AvatarSize}) {
  const {$size = 1, className, style, ...rest} = props
  const {avatar} = useThemeV2()
  const size = avatar.sizes[$size]?.size

  return (
    <div
      {...rest}
      className={clsx(spacerAvatar, className)}
      style={{
        ...assignInlineVars({[avatarSizeVar]: size === undefined ? undefined : `${size}px`}),
        ...style,
      }}
    />
  )
}
