import {type Context} from 'react'
import {createContext} from 'sanity/_createContext'

import type {FormNodePresence} from '../../core/presence/types'

/**
 * @internal
 */
export const PresenceContext: Context<FormNodePresence[]> = createContext<FormNodePresence[]>(
  'sanity/_singletons/context/presence',
  [],
)
