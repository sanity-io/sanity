/* eslint-disable react/no-unused-prop-types */
import React, {createContext, useContext, useMemo} from 'react'
import {FormNodeValidation, Path, ValidationMarker} from '@sanity/types'
import {startsWith} from '@sanity/util/paths'

const ValidationContext = createContext<ValidationMarker[]>([])

export function ValidationProvider(props: {
  validation: ValidationMarker[]
  children: React.ReactNode
}) {
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

export function useChildValidation(path: Path): FormNodeValidation[] {
  const validation = useValidationMarkers()
  return useMemo(
    () =>
      validation
        .filter((item) => startsWith(path, item.path))
        .map((marker) => ({
          message: marker.item.message,
          level: marker.level,
          path: marker.path,
        })) as FormNodeValidation[],
    [path, validation]
  )
}
