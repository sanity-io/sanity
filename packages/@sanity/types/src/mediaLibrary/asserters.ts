import {MEDIA_LIBRARY_ASSET_ASPECT_TYPE_NAME, type MediaLibraryAssetAspectDocument} from './types'

/**
 * Check whether the provided value resembles a Media Library asset aspect document.
 *
 * Note: This function does not perform a comprehensive check.
 *
 * @see validateMediaLibraryAssetAspect
 *
 * @internal
 */
export function isAssetAspect(
  maybeAssetAspect: unknown,
): maybeAssetAspect is MediaLibraryAssetAspectDocument {
  return (
    typeof maybeAssetAspect === 'object' &&
    maybeAssetAspect !== null &&
    '_type' in maybeAssetAspect &&
    maybeAssetAspect._type === MEDIA_LIBRARY_ASSET_ASPECT_TYPE_NAME
  )
}
