import {
  isValidationErrorMarker,
  isValidationWarningMarker,
  type ValidationMarker,
} from '@sanity/types'
import {type ButtonTone} from '@sanity/ui'
import {useMemo} from 'react'

import {type ValidationStatus} from '../types'

export const EMPTY_VALIDATION_STATUS: ValidationStatus = {
  validation: [],
  isValidating: false,
}

interface ValidationState {
  markers: ValidationMarker[]
  validationTone: ButtonTone
  hasError: boolean
  hasWarning: boolean
}

export function getValidationState(
  validationMarkers: ValidationMarker[] = EMPTY_VALIDATION_STATUS.validation,
): ValidationState {
  const hasError = validationMarkers.filter(isValidationErrorMarker).length > 0
  const hasWarning = validationMarkers.filter(isValidationWarningMarker).length > 0

  let validationTone: ButtonTone = 'default'
  if (hasWarning) {
    validationTone = 'default' //not using 'caution' for now
  }
  if (hasError) {
    validationTone = 'critical'
  }

  return {
    markers: validationMarkers,
    validationTone,
    hasError,
    hasWarning,
  }
}

export function useValidationState(markers: ValidationMarker[]): ValidationState {
  return useMemo(() => getValidationState(markers), [markers])
}
