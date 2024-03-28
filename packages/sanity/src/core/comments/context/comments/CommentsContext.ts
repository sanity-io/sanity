import {createContext} from 'react'

import {type CommentsContextValue} from './types'

export const CommentsContext = createContext<CommentsContextValue | null>(null)
