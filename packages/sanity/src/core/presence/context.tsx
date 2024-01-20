import {createContext} from 'react'

import {type FormNodePresence} from './types'

/** @internal */
export const FormFieldPresenceContext = createContext<FormNodePresence[]>([])
