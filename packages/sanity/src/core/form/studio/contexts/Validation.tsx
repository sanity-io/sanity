/* eslint-disable react/no-unused-prop-types */

import {type FormNodeValidation, type Path, type ValidationMarker} from '@sanity/types'
import {isEqual, startsWith} from '@sanity/util/paths'
import {type ReactNode, useContext, useMemo} from 'react'
import {ValidationContext} from 'sanity/_singletons'

export function ValidationProvider(props: {validation: ValidationMarker[]; children: ReactNode}) {
  return (
    <ValidationContext.Provider value={props.validation}>
      {props.children}
    </ValidationContext.Provider>
  )
}

export function useValidationMarkers(): ValidationMarker[] {
  const ctx = useContext(ValidationContext)
  if (!ctx) {
    throw new Error('Form context not provided')
  }
  return ctx
}

/**
 * @alpha
 * @param path - the path to return child validation for
 * @param inclusive - whether to include validation for the current path (default false)
 */
export function useChildValidation(path: Path, inclusive = false): FormNodeValidation[] {
  const validation = useValidationMarkers()
  return useMemo(
    () =>
      validation
        .filter((item) => startsWith(path, item.path) && (inclusive || !isEqual(path, item.path)))
        .map((marker) => ({
          message: marker.message,
          level: marker.level,
          path: marker.path,
        })) as FormNodeValidation[],
    [inclusive, path, validation],
  )
}
