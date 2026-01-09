import {type ValidationMarker} from '@sanity/types'

/**
 * Ignore anything but the 'media' validation markers
 *
 * This is used to still allow an asset selection even if there are other validation errors on the field,
 *
 * @param validationMarkers - The validation markers to filter.
 * @returns The filtered validation markers.
 */
export function filterMediaValidationMarkers(validationMarkers: ValidationMarker[]) {
  return validationMarkers.filter((marker) => {
    if (
      '__internal_metadata' in marker &&
      typeof marker.__internal_metadata === 'object' &&
      marker.__internal_metadata !== null &&
      'name' in marker.__internal_metadata &&
      marker.__internal_metadata?.name === 'media'
    ) {
      return true
    }
    return false
  })
}
