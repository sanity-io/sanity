/* eslint-disable react/no-unused-prop-types */
import React, {useContext, createContext, useMemo} from 'react'
import {Path} from '@sanity/types'
import {startsWith} from '@sanity/util/paths'
import {FormNodePresence} from '../../../presence'

const PresenceContext = createContext<FormNodePresence[]>([])

export function PresenceProvider(props: {presence: FormNodePresence[]; children: React.ReactNode}) {
  return (
    <PresenceContext.Provider value={props.presence}>{props.children}</PresenceContext.Provider>
  )
}

export function useFormFieldPresence(): FormNodePresence[] {
  const ctx = useContext(PresenceContext)
  if (!ctx) {
    throw new Error('Form context not provided')
  }
  return ctx
}

export function useChildPresence(path: Path): FormNodePresence[] {
  const presence = useFormFieldPresence()
  return useMemo(() => presence.filter((item) => startsWith(path, item.path)), [path, presence])
}
