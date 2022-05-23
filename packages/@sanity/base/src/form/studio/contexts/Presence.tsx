/* eslint-disable react/no-unused-prop-types */
import React, {useContext, createContext} from 'react'
import {FormFieldPresence} from '../../../presence'

const PresenceContext = createContext<FormFieldPresence[]>([])

export function PresenceProvider(props: {
  presence: FormFieldPresence[]
  children: React.ReactNode
}) {
  return (
    <PresenceContext.Provider value={props.presence}>{props.children}</PresenceContext.Provider>
  )
}

export function useFormFieldPresence(): FormFieldPresence[] {
  const ctx = useContext(PresenceContext)
  if (!ctx) {
    throw new Error('Form context not provided')
  }
  return ctx
}
