import {type ValidationMarker} from '@sanity/types'

/**
 * Ignore asset required validation markers.
 *
 * This is used to still allow asset selection when validating
 * asset source media library assets.
 *
 * @param validationMarkers - The validation markers to filter.
 * @returns The filtered validation markers.
 */
export function ignoreAssetRequiredValidation(validationMarkers: ValidationMarker[]) {
  return validationMarkers.filter((marker) => {
    if (
      '__internal_metadata' in marker &&
      typeof marker.__internal_metadata === 'object' &&
      marker.__internal_metadata !== null &&
      'name' in marker.__internal_metadata &&
      marker.__internal_metadata.name === 'assetRequired'
    ) {
      return false
    }
    return true
  })
}
