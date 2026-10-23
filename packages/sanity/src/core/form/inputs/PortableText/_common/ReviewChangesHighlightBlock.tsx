import {useTheme_v2 as useThemeV2} from '@sanity/ui'
import {rgba} from '@sanity/ui/theme'
import {clsx} from 'clsx'
import {type ComponentProps, type CSSProperties} from 'react'

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
      style={
        {
          [radius3Var]: `${radius[3]}px`,
          [space1Var]: `${space[1]}px`,
          [space2Var]: `${space[2]}px`,
          [space4Var]: `${space[4]}px`,
          [bgColorVar]: rgba(color.avatar.yellow.bg, 0.2),
          ...style,
        } as CSSProperties
      }
    />
  )
}
