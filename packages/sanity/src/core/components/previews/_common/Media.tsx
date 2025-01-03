import {Text} from '@sanity/ui'
import {isValidElement, type ReactNode} from 'react'
import {isValidElementType} from 'react-is'

import {type PreviewLayoutKey, type PreviewMediaDimensions, type PreviewProps} from '../types'
import {MediaWrapper} from './Media.styled'

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

  return (
    <MediaWrapper
      $dimensions={dimensions}
      $layout={layout}
      $radius={radius}
      $responsive={responsive}
      className={styles?.media}
      data-testid="Media"
    >
      {renderMedia({dimensions, layout, media})}
      {border && <span data-border />}
    </MediaWrapper>
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
