import {rem, Text, useTheme_v2 as useThemeV2} from '@sanity/ui'
import {assignInlineVars} from '@vanilla-extract/dynamic'
import {type ComponentType, isValidElement, type ReactNode} from 'react'
import {isValidElementType} from 'react-is'

import {PREVIEW_SIZES} from '../constants'
import {type PreviewLayoutKey, type PreviewMediaDimensions, type PreviewProps} from '../types'
import {heightVar, iconSizeVar, mediaWrapper, minWidthVar, radiusVar, widthVar} from './Media.css'

export interface MediaProps {
  border?: boolean
  dimensions: PreviewMediaDimensions
  layout: PreviewLayoutKey
  media: PreviewProps['media']
  radius?: number
  responsive?: boolean
  styles?: {
    media?: string
    mediaString?: string
  }
}

export function Media(props: MediaProps) {
  const {border = true, dimensions, layout, media, radius = 1, responsive = false, styles} = props
  const theme = useThemeV2()

  const width = dimensions.width || 0
  const height = dimensions.width || 0
  const iconSize = PREVIEW_SIZES[layout].icon

  return (
    <span
      className={styles?.media ? `${mediaWrapper} ${styles.media}` : mediaWrapper}
      data-testid="Media"
      style={assignInlineVars({
        [widthVar]: responsive ? '100%' : String(rem(width)),
        [heightVar]: responsive ? '100%' : String(rem(height)),
        [minWidthVar]: responsive ? '' : String(rem(width)),
        [radiusVar]: `${theme.radius[radius]}px`,
        [iconSizeVar]: `calc(${iconSize} / 16 * 1em)`,
      })}
    >
      {renderMedia({dimensions, layout, media})}
      {border && <span data-border />}
    </span>
  )
}

function renderMedia(props: {
  dimensions: PreviewMediaDimensions
  layout: PreviewLayoutKey
  media: PreviewProps['media']
  styles?: {
    media?: string
    mediaString?: string
  }
}): ReactNode {
  const {dimensions, layout, media, styles} = props

  if (typeof media === 'string') {
    return (
      <Text as="span" className={styles?.mediaString} size={1}>
        {media}
      </Text>
    )
  }

  if (isValidElementType(media)) {
    const MediaComponent = media as ComponentType<{
      dimensions: PreviewMediaDimensions
      layout: PreviewLayoutKey
    }>
    return <MediaComponent dimensions={dimensions} layout={layout} />
  }

  if (isValidElement(media)) {
    return media
  }

  return null
}
