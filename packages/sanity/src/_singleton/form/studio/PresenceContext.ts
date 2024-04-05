import {createContext} from 'react'

import {type FormNodePresence} from '../../presence/types'

export const PresenceContext = createContext<FormNodePresence[]>([])
