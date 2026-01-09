import {isImageSource} from '@sanity/asset-utils'
import {type GlobalDocumentReferenceValue} from '@sanity/types'

import {type BaseImageInputValue} from '../../form/inputs/files/ImageInput'

interface MediaLibraryImageValue extends BaseImageInputValue {
  media?: GlobalDocumentReferenceValue
}

/**
 * @internal
 */
export type MediaLibraryRef = `media-library:${string}:${string}`

export function makeMediaLibraryRef(libraryId: string, assetId: string): MediaLibraryRef {
  return `media-library:${libraryId}:${assetId}`
}

function isMediaLibraryRef(ref: unknown): ref is MediaLibraryRef {
  if (typeof ref !== 'string') return false

  const [resourceType, resourceId, documentId] = ref.split(':', 3)

  return resourceType === 'media-library' && Boolean(resourceId) && Boolean(documentId)
}

/**
 * Attempts to extract a Media Library ref string from an image source or raw
 * string value.
 *
 * @internal
 */
export function getMediaLibraryRef(value: unknown): MediaLibraryRef | undefined {
  const maybeRef = isImageSource(value)
    ? (value as MediaLibraryImageValue | undefined)?.media?._ref
    : value

  return isMediaLibraryRef(maybeRef) ? maybeRef : undefined
}
