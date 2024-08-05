import {createContext} from 'sanity/_createContext'

import type {FormNodePresence} from '../../core/presence/types'

/** @internal */
export const FormFieldPresenceContext = createContext<FormNodePresence[]>(
  'sanity/_singletons/context/form-field-presence',
  [],
)
