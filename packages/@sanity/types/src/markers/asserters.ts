import {type ValidationMarker} from './types'

/** @internal */
export function isValidationErrorMarker(
  marker: ValidationMarker,
): marker is ValidationMarker & {level: 'error'} {
  return marker.level === 'error'
}

/** @internal */
export function isValidationWarningMarker(
  marker: ValidationMarker,
): marker is ValidationMarker & {level: 'warning'} {
  return marker.level === 'warning'
}

/** @internal */
export function isValidationInfoMarker(
  marker: ValidationMarker,
): marker is ValidationMarker & {level: 'info'} {
  return marker.level === 'info'
}
