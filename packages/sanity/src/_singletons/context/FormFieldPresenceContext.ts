import {createContext} from 'react'

import type {FormNodePresence} from '../../../core/presence/types'

/** @internal */
export const FormFieldPresenceContext = createContext<FormNodePresence[]>([])
