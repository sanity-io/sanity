import {createContext} from 'react'
import {FormNodePresence} from './types'

/** @internal */
export const FormFieldPresenceContext = createContext<FormNodePresence[]>([])
