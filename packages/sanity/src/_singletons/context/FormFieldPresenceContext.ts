import type {FormNodePresence} from '../../core/presence/types'
import {createContext} from 'sanity/_createContext'

/** @internal */
export const FormFieldPresenceContext = createContext<FormNodePresence[]>(
  'sanity/_singletons/context/form-field-presence',
  [],
)
