import type {ValidationMarker} from './types'

export function isValidationErrorMarker(
  marker: ValidationMarker
): marker is ValidationMarker & {level: 'error'} {
  return marker.level === 'error'
}

export function isValidationWarningMarker(
  marker: ValidationMarker
): marker is ValidationMarker & {level: 'warning'} {
  return marker.level === 'warning'
}

export function isValidationInfoMarker(
  marker: ValidationMarker
): marker is ValidationMarker & {level: 'info'} {
  return marker.level === 'info'
}
