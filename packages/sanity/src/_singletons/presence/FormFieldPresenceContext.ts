import {createContext} from 'react'
import type {FormNodePresence} from 'sanity'

/** @internal */
export const FormFieldPresenceContext = createContext<FormNodePresence[]>([])
