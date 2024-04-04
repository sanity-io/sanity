import {createContext} from 'react'
import {type FormNodePresence} from 'sanity/_singleton'

/** @internal */
export const FormFieldPresenceContext = createContext<FormNodePresence[]>([])
