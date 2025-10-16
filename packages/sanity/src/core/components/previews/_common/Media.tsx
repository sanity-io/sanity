import {Text} from '@sanity/ui'
import {vars} from '@sanity/ui/css'
import {type Radius} from '@sanity/ui/theme'
import {isValidElement, type ReactNode} from 'react'
import {isValidElementType} from 'react-is'

import {type PreviewLayoutKey, type PreviewMediaDimensions, type PreviewProps} from '../types'
import * as styles from './Media.css'

const rem = (value: number) => `${value / 16}rem`

export interface MediaProps {
  border?: boolean
  dimensions: PreviewMediaDimensions
  layout: PreviewLayoutKey
  media: PreviewProps['media']
  radius?: Radius
  responsive?: boolean
  styles?: {
    media?: string
    mediaString?: string
  }
}

export function Media(props: MediaProps) {
  const {
    border = true,
    dimensions,
    layout,
    media,
    radius = 1,
    responsive = false,
    styles: propStyles,
  } = props

  const width = dimensions.width || 0
  const height = dimensions.height || 0

  const wrapperStyle = {
    position: 'relative' as const,
    width: responsive ? '100%' : rem(width),
    height: responsive ? '100%' : rem(height),
    minWidth: responsive ? undefined : rem(width),
    borderRadius: vars.radius[radius],
    display: 'flex',
    overflow: 'clip' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  }

  return (
    <span
      className={propStyles?.media}
      data-testid="Media"
      style={wrapperStyle}
      data-media-wrapper=""
      data-layout={layout}
    >
      {renderMedia({dimensions, layout, media})}
      {border && <span className={styles.mediaWrapperBorderStyle} data-border />}
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

  if (isValidElementType(media)) {
    const MediaComponent = media
    return <MediaComponent dimensions={dimensions} layout={layout} />
  }

  if (typeof media === 'string') {
    return (
      <Text as="span" className={styles?.mediaString} size={1}>
        {media}
      </Text>
    )
  }

  if (isValidElement(media)) {
    return media
  }

  return null
}
