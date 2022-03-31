import {Marker, ValidationMarker} from './types'

export function isValidationMarker(marker: Marker): marker is ValidationMarker {
  return marker.type === 'validation'
}

export function isValidationErrorMarker(
  marker: Marker
): marker is ValidationMarker & {level: 'error'} {
  return isValidationMarker(marker) && marker.level === 'error'
}

export function isValidationWarningMarker(
  marker: Marker
): marker is ValidationMarker & {level: 'warning'} {
  return isValidationMarker(marker) && marker.level === 'warning'
}

export function isValidationInfoMarker(
  marker: Marker
): marker is ValidationMarker & {level: 'info'} {
  return isValidationMarker(marker) && marker.level === 'info'
}
