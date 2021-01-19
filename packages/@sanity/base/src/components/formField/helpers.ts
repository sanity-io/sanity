import {isValidationMarker, ValidationMarker} from '@sanity/types'
import {FormFieldValidation} from './types'

export function markersToValidationList(markers: ValidationMarker[]): FormFieldValidation[] {
  const validationMarkers = markers.filter(isValidationMarker)

  return validationMarkers.map((marker) => {
    return {
      type: marker.level === 'error' ? 'error' : 'warning',
      label: marker.item.message,
    }
  })
}
