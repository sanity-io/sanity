import React, {useMemo} from 'react'
import {getDevicePixelRatio} from 'use-device-pixel-ratio'
import {MediaDimensions, PreviewProps} from './types'
import {RootSpan, MediaSpan, TextSpan} from './inlinePreview.styled'

const DEFAULT_MEDIA_DIMENSIONS: MediaDimensions = {
  width: 32,
  height: 32,
  fit: 'crop',
  aspect: 1,
  dpr: getDevicePixelRatio(),
}

export const InlinePreview: React.FunctionComponent<PreviewProps<'inline'>> = (props) => {
  const {
    title,
    fallbackTitle = 'Untitled',
    media,
    mediaDimensions = DEFAULT_MEDIA_DIMENSIONS,
  } = props

  const _media = useMemo(() => {
    if (typeof media === 'function') {
      return media({
        dimensions: mediaDimensions,
        layout: 'inline',
      })
    }

    return media
  }, [media, mediaDimensions])

  return (
    <RootSpan data-testid="inline-preview">
      {_media && (
        <MediaSpan data-testid="inline-preview-media">
          {_media}
          <span />
        </MediaSpan>
      )}
      <TextSpan data-testid="inline-preview-title">
        <span>{title || fallbackTitle}</span>
      </TextSpan>
    </RootSpan>
  )
}
