/* eslint-disable react/no-unused-prop-types */

import {type Path} from '@sanity/types'
import {isEqual, startsWith} from '@sanity/util/paths'
import {type ReactNode, useContext, useRef} from 'react'
import {PresenceContext} from 'sanity/_singletons'

import {type FormNodePresence} from '../../../presence'
import {immutableReconcile} from '../../store/utils/immutableReconcile'

export function PresenceProvider(props: {presence: FormNodePresence[]; children: ReactNode}) {
  return (
    <PresenceContext.Provider value={props.presence}>{props.children}</PresenceContext.Provider>
  )
}
PresenceProvider.displayName = 'PresenceProvider'

export function useFormFieldPresence(): FormNodePresence[] {
  const ctx = useContext(PresenceContext)
  if (!ctx) {
    throw new Error('Form context not provided')
  }
  return ctx
}

/**
 * @alpha
 * @param path - the path to return child presence for
 * @param inclusive - whether to include presence for the current path (default false)
 */
export function useChildPresence(path: Path, inclusive?: boolean): FormNodePresence[] {
  const presence = useFormFieldPresence()
  const prev = useRef(presence)
  const next = immutableReconcile(
    prev.current,
    presence.filter(
      (item) => startsWith(path, item.path) && (inclusive || !isEqual(path, item.path)),
    ),
  )
  prev.current = next
  return next
}
