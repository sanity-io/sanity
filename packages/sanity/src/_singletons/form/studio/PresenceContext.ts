import {createContext} from 'react'
import type {FormNodePresence} from 'sanity'

export const PresenceContext = createContext<FormNodePresence[]>([])
