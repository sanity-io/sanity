import {rgba} from '@sanity/ui'
import {useTheme_v2 as useThemeV2} from '@sanity/ui'
import {assignInlineVars} from '@vanilla-extract/dynamic'
import {type HTMLProps} from 'react'

import {
  bgVar,
  borderRadiusVar,
  bottomVar,
  leftVar,
  reviewChangesHighlightBlock,
  rightVar,
  topVar,
} from './ReviewChangesHighlightBlock.css'

export function ReviewChangesHighlightBlock(
  props: {$fullScreen: boolean} & HTMLProps<HTMLDivElement>,
) {
  const {$fullScreen, ...rest} = props
  const {radius, space, color} = useThemeV2()
  const bg = rgba(color.spot.yellow, 0.2)

  return (
    <div
      {...rest}
      className={reviewChangesHighlightBlock}
      style={assignInlineVars({
        [borderRadiusVar]: `${radius[3]}px`,
        [topVar]: `-${space[2]}px`,
        [bottomVar]: `-${space[1] + space[1]}px`,
        [leftVar]: `${$fullScreen ? space[4] + space[1] : space[1]}px`,
        [rightVar]: `${space[1]}px`,
        [bgVar]: bg,
      })}
    />
  )
}
