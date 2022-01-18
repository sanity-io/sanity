import {Text} from '@sanity/ui'
import React, {isValidElement, useMemo} from 'react'
import {PreviewMediaDimensions, PreviewLayoutKey, PreviewProps} from '../types'
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
  const {border = true, dimensions, layout, media, radius = 2, responsive = false, styles} = props

  const child = useMemo(() => {
    if (typeof media === 'function') {
      return media({dimensions, layout})
    }

    if (typeof media === 'string') {
      return (
        <Text as="span" className={styles?.mediaString}>
          {media}
        </Text>
      )
    }

    if (isValidElement(media)) {
      return media
    }

    return null
  }, [dimensions, layout, media, styles?.mediaString])

  return (
    <MediaWrapper
      $dimensions={dimensions}
      $layout={layout}
      $radius={radius}
      $responsive={responsive}
      className={styles?.media}
      data-testid="Media"
    >
      {child}
      {border && <span />}
    </MediaWrapper>
  )
}
