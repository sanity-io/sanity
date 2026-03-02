/* eslint sort-keys: "error" */
import {defineLocalesResources} from '../../../core/i18n'

/**
 * Defined locale strings for the media library plugin, in US English.
 *
 * @internal
 */
const mediaLibraryLocaleStrings = defineLocalesResources('media-library', {
  /** Warning description for invalid video value */
  'invalid-video-warning.description':
    'The value of this field is not a valid video. Resetting this field will let you choose a new video.',
  /** Reset button text for invalid video warning */
  'invalid-video-warning.reset-button.text': 'Reset value',
  /** Warning title for invalid video value */
  'invalid-video-warning.title': 'Invalid video value',
  /** Video error fallback description */
  'video-error.description': 'Failed to load video',
  /** Retry button text for video loading errors */
  'video-error.retry-button.text': 'Retry',
})

/**
 * @internal
 */
export type MediaLibraryLocaleResourceKeys = keyof typeof mediaLibraryLocaleStrings

export default mediaLibraryLocaleStrings
