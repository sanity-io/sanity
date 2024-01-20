import {createContext} from 'react'

import {type CommentsEnabledContextValue} from './types'

export const CommentsEnabledContext = createContext<CommentsEnabledContextValue | null>(null)
