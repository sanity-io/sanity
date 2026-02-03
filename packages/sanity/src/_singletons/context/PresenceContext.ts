import type {FormNodePresence} from '../../core/presence/types'
import {createContext} from 'sanity/_createContext'

/**
 * @internal
 */
export const PresenceContext = createContext<FormNodePresence[]>(
  'sanity/_singletons/context/presence',
  [],
)
