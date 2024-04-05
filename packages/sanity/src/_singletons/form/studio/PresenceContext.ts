import {createContext} from 'react'
import type {FormNodePresence} from 'sanity'

/**
 * @internal
 */
export const PresenceContext = createContext<FormNodePresence[]>([])
