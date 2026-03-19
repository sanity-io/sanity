// eslint-disable-next-line camelcase
import {useTheme_v2 as useThemeV2} from '@sanity/ui'
import {assignInlineVars} from '@vanilla-extract/dynamic'
import {getDevicePixelRatio} from 'use-device-pixel-ratio'

import {PREVIEW_SIZES} from '../constants'
import {renderPreviewMedia, renderPreviewNode} from '../helpers'
import {type PreviewMediaDimensions, type PreviewProps} from '../types'
import {
  fontSizeVar,
  fontWeightVar,
  lineHeightVar,
  mediaSpan,
  radiusVar,
  rootSpan,
  textSpan,
} from './InlinePreview.css'

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

  const {font, radius} = useThemeV2()
  const textFont = font.text
  const textSize = textFont.sizes[1]

  return (
    <span className={rootSpan} data-testid="inline-preview">
      {media && (
        <span
          className={mediaSpan}
          data-testid="inline-preview-media"
          style={assignInlineVars({
            [radiusVar]: `${radius[1]}px`,
          })}
        >
          {renderPreviewMedia(media, 'inline', mediaDimensions)}
          <span />
        </span>
      )}

      <span
        className={textSpan}
        data-testid="inline-preview-title"
        style={assignInlineVars({
          [fontSizeVar]: `calc(${textSize.fontSize} / 16 * 1em)`,
          [fontWeightVar]: String(textFont.weights.medium),
          [lineHeightVar]: String(textSize.lineHeight / textSize.fontSize),
        })}
      >
        {renderPreviewNode(title, 'inline', fallbackTitle)}
      </span>
    </span>
  )
}
