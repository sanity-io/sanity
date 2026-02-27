import {type GlobalDocumentReferenceValue} from '@sanity/types'

/**
 * @internal
 */
export type MediaLibraryRef = `media-library:${string}:${string}`

function hasOwnRecord<K extends PropertyKey>(value: unknown, key: K): value is Record<K, unknown> {
  return (
    typeof value === 'object' && value !== null && Object.prototype.hasOwnProperty.call(value, key)
  )
}

export function makeMediaLibraryRef(libraryId: string, assetId: string): MediaLibraryRef {
  return `media-library:${libraryId}:${assetId}`
}

export function containsMediaProperty(
  value: unknown,
): value is {media: GlobalDocumentReferenceValue} {
  if (!hasOwnRecord(value, 'media') || !hasOwnRecord(value.media, '_ref')) {
    return false
  }
  return typeof value.media._ref === 'string'
}

function isMediaLibraryRef(ref: unknown): ref is MediaLibraryRef {
  if (typeof ref !== 'string') return false

  const [resourceType, resourceId, documentId] = ref.split(':', 3)

  return resourceType === 'media-library' && Boolean(resourceId) && Boolean(documentId)
}

/**
 * Attempts to extract a Media Library ref from a source or raw string value.
 *
 * @internal
 */
export function getMediaLibraryRef(value: unknown): MediaLibraryRef | undefined {
  const maybeRef = containsMediaProperty(value) ? value?.media?._ref : value

  return isMediaLibraryRef(maybeRef) ? maybeRef : undefined
}
