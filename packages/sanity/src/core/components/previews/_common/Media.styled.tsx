import {rem, useTheme_v2 as useThemeV2} from '@sanity/ui'
import {assignInlineVars} from '@vanilla-extract/dynamic'
import {clsx} from 'clsx'
import {type ComponentProps} from 'react'

import {PREVIEW_SIZES} from '../constants'
import {type PreviewLayoutKey, type PreviewMediaDimensions} from '../types'
import {
  mediaHeightVar,
  mediaIconSizeVar,
  mediaRadiusVar,
  mediaWidthVar,
  mediaWrapper,
  mediaWrapperFixed,
  mediaWrapperResponsive,
} from './Media.css'

export function MediaWrapper(
  props: ComponentProps<'span'> & {
    $dimensions: PreviewMediaDimensions
    $layout: PreviewLayoutKey
    $radius: number
    $responsive: boolean
  },
) {
  const {$dimensions, $layout, $radius, $responsive, className, style, ...rest} = props
  const {radius} = useThemeV2()
  const width = $dimensions.width || 0
  // Kept from the original rule: the height derives from the width, not the height
  const height = $dimensions.width || 0
  const iconSize = PREVIEW_SIZES[$layout].icon

  return (
    <span
      {...rest}
      className={clsx(
        mediaWrapper,
        $responsive ? mediaWrapperResponsive : mediaWrapperFixed,
        className,
      )}
      style={{
        ...assignInlineVars({
          [mediaWidthVar]: $responsive ? undefined : `${rem(width)}`,
          [mediaHeightVar]: $responsive ? undefined : `${rem(height)}`,
          [mediaRadiusVar]: `${rem(radius[$radius])}`,
          [mediaIconSizeVar]: `${iconSize}`,
        }),
        ...style,
      }}
    />
  )
}
