import React from 'react'
import {Box, Text} from '@sanity/ui'
import {getDevicePixelRatio} from 'use-device-pixel-ratio'
import {ProgressCircle} from '../progress'
import type {MediaDimensions, PreviewProps} from './types'
import {MediaWrapper, MediaString, Root, ProgressWrapper} from './mediaPreview.styled'

const DEFAULT_MEDIA_DIMENSIONS: MediaDimensions = {
  width: 160,
  height: 160,
  aspect: 1,
  fit: 'crop',
  dpr: getDevicePixelRatio(),
}

export const MediaPreview: React.FunctionComponent<PreviewProps<'media'>> = (props) => {
  const {
    title,
    media,
    mediaDimensions = DEFAULT_MEDIA_DIMENSIONS,
    children,
    isPlaceholder,
    progress,
  } = props
  const aspect = mediaDimensions?.aspect || DEFAULT_MEDIA_DIMENSIONS.aspect!
  const STYLES_PADDER = {
    paddingTop: `${100 / aspect}%`,
  }

  if (isPlaceholder) {
    return (
      <Root overflow="hidden" flex={1}>
        <div style={STYLES_PADDER} />
      </Root>
    )
  }

  return (
    <Root overflow="hidden" flex={1} title={typeof title === 'string' ? title : undefined}>
      <div style={STYLES_PADDER} />

      <MediaWrapper align="center" justify="center">
        {typeof media === 'undefined' && <Box>{title}</Box>}
        {typeof media === 'function' &&
          media({
            dimensions: mediaDimensions,
            layout: 'media',
          })}
        {typeof media === 'string' && (
          <MediaString padding={1}>
            <Text textOverflow="ellipsis">{media}</Text>
          </MediaString>
        )}
        {React.isValidElement(media) && media}
        {typeof progress === 'number' && progress > -1 && (
          <ProgressWrapper align="center" justify="center">
            <ProgressCircle percent={progress} showPercent text="Uploaded" />
          </ProgressWrapper>
        )}
      </MediaWrapper>
      {children}
    </Root>
  )
}
