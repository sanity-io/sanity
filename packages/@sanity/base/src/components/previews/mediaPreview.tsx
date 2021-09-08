import React from 'react'
import {Box, Text} from '@sanity/ui'
import {ProgressCircle} from './progressCircle'
import {MediaDimensions} from './types'
import {MediaWrapper, MediaString, Root, ProgressWrapper} from './mediaPreview.styled'

interface MediaPreviewProps {
  title?: string
  media?: React.ReactNode | React.FC<{dimensions: MediaDimensions; layout: 'media'}>
  progress?: number
  mediaDimensions?: MediaDimensions
  children?: React.ReactNode
  isPlaceholder?: boolean
}

const DEFAULT_MEDIA_DIMENSIONS: MediaDimensions = {
  width: 160,
  height: 160,
  aspect: 1,
  fit: 'crop',
}

export const MediaPreview: React.FunctionComponent<MediaPreviewProps> = (props) => {
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
      <Root>
        <Box style={STYLES_PADDER} />
      </Root>
    )
  }

  return (
    <Root title={typeof title === 'string' ? title : undefined}>
      <Box style={STYLES_PADDER} />

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
