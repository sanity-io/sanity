/**
 * How long, in milliseconds, an upload has to be inactive for in order to consider it stale.
 * E.g. if it's more than this amount of milliseconds since last time upload state was reported,
 * the upload will be marked as stale/interrupted.
 */
export const STALE_UPLOAD_MS = 1000 * 60 * 2

/**
 * The mime types of image formats we support uploading
 *
 * @internal
 */
export const SUPPORTED_IMAGE_UPLOAD_TYPES = [
  'image/bmp',
  'image/gif',
  'image/jpeg',
  'image/png',
  'image/svg',
  'image/tiff',
  'image/webp',
  '.psd', // Many different mime types for PSD files, so we just use the extension
]
