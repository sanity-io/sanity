import React, {useMemo} from 'react'
import {getDevicePixelRatio} from 'use-device-pixel-ratio'
import {MediaDimensions, PreviewProps} from './types'
import {RootSpan, MediaDiv, TextSpan} from './inlinePreview.styled'

const DEFAULT_MEDIA_DIMENSIONS: MediaDimensions = {
  width: 32,
  height: 32,
  fit: 'crop',
  aspect: 1,
  dpr: getDevicePixelRatio(),
}

export const InlinePreview: React.FunctionComponent<PreviewProps<'inline'>> = (props) => {
  const {title, media, mediaDimensions = DEFAULT_MEDIA_DIMENSIONS} = props

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
        <MediaDiv data-testid="inline-preview-media">
          {_media}
          <span />
        </MediaDiv>
      )}
      <TextSpan data-testid="inline-preview-title">
        <span>{title || 'Untitled'}</span>
      </TextSpan>
    </RootSpan>
  )
}
