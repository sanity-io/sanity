/* eslint-disable react/no-unused-prop-types */
import {ValidationMarker} from '@sanity/types'
import React, {useContext, createContext} from 'react'

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
