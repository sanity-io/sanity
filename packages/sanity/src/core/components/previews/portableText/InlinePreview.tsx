import {Text} from '@sanity/ui'
import {getDevicePixelRatio} from 'use-device-pixel-ratio'

import {PREVIEW_SIZES} from '../constants'
import {renderPreviewMedia, renderPreviewNode} from '../helpers'
import {type PreviewMediaDimensions, type PreviewProps} from '../types'
import * as styles from './InlinePreview.css'

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
    <span className={styles.rootSpanStyle} data-testid="inline-preview">
      {media && (
        <span className={styles.mediaSpanStyle} data-testid="inline-preview-media">
          {renderPreviewMedia(media, 'inline', mediaDimensions)}
          <span />
        </span>
      )}

      <Text as="span" className={styles.textSpanStyle} data-testid="inline-preview-title" size={1}>
        {renderPreviewNode(title, 'inline', fallbackTitle)}
      </Text>
    </span>
  )
}
