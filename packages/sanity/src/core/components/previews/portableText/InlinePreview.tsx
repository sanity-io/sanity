import React from 'react'
import {getDevicePixelRatio} from 'use-device-pixel-ratio'
import {PREVIEW_SIZES} from '../constants'
import {renderPreviewMedia, renderPreviewNode} from '../helpers'
import {PreviewMediaDimensions, PreviewProps} from '../types'
import {RootSpan, MediaSpan, TextSpan} from './InlinePreview.styled'

/**
 * @hidden
 * @beta */
export type InlinePreviewProps = Omit<PreviewProps<'inline'>, 'renderDefault'>

const DEFAULT_MEDIA_DIMENSIONS: PreviewMediaDimensions = {
  ...PREVIEW_SIZES.inline.media,
  fit: 'crop',
  aspect: 1,
  dpr: getDevicePixelRatio(),
}

/**
 * @hidden
 * @beta */
export function InlinePreview(props: InlinePreviewProps) {
  const {
    title,
    fallbackTitle = 'Untitled',
    media,
    mediaDimensions = DEFAULT_MEDIA_DIMENSIONS,
  } = props

  return (
    <RootSpan data-testid="inline-preview">
      {media && (
        <MediaSpan data-testid="inline-preview-media">
          {renderPreviewMedia(media, 'inline', mediaDimensions)}
          <span />
        </MediaSpan>
      )}

      <TextSpan data-testid="inline-preview-title" size={1}>
        {renderPreviewNode(title, 'inline', fallbackTitle)}
      </TextSpan>
    </RootSpan>
  )
}
