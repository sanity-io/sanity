import {createContext} from 'sanity/_createContext'

import type {FormNodePresence} from '../../core/presence/types'

/**
 * @internal
 */
export const PresenceContext = createContext<FormNodePresence[]>(
  'sanity/_singletons/context/presence',
  [],
)
