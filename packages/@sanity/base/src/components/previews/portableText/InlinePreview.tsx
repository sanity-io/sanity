import React, {useMemo} from 'react'
import {getDevicePixelRatio} from 'use-device-pixel-ratio'
import {PREVIEW_MEDIA_SIZE} from '../constants'
import {PreviewMediaDimensions, PreviewProps} from '../types'
import {RootSpan, MediaSpan, TextSpan} from './InlinePreview.styled'

type InlinePreviewProps = PreviewProps<'inline'>

const DEFAULT_MEDIA_DIMENSIONS: PreviewMediaDimensions = {
  ...PREVIEW_MEDIA_SIZE.inline,
  fit: 'crop',
  aspect: 1,
  dpr: getDevicePixelRatio(),
}

export function InlinePreview(props: InlinePreviewProps) {
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

      <TextSpan data-testid="inline-preview-title" size={1}>
        {title || fallbackTitle}
      </TextSpan>
    </RootSpan>
  )
}
