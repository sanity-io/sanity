import {useTheme_v2 as useThemeV2} from '@sanity/ui'
import {rgba} from '@sanity/ui/theme'
import {assignInlineVars} from '@vanilla-extract/dynamic'
import {clsx} from 'clsx'
import {type ComponentProps} from 'react'

import {
  bgColorVar,
  radius3Var,
  root,
  rootFullScreen,
  space1Var,
  space2Var,
  space4Var,
} from './ReviewChangesHighlightBlock.css'

export function ReviewChangesHighlightBlock(
  props: ComponentProps<'div'> & {
    $fullScreen: boolean
  },
) {
  const {$fullScreen, className, style, ...rest} = props
  const {color, radius, space} = useThemeV2()

  return (
    <div
      {...rest}
      className={clsx(root, $fullScreen && rootFullScreen, className)}
      style={{
        ...assignInlineVars({
          [radius3Var]: `${radius[3]}px`,
          [space1Var]: `${space[1]}px`,
          [space2Var]: `${space[2]}px`,
          [space4Var]: `${space[4]}px`,
          [bgColorVar]: rgba(color.avatar.yellow.bg, 0.2),
        }),
        ...style,
      }}
    />
  )
}
