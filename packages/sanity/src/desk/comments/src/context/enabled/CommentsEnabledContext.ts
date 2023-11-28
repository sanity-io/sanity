import {createContext} from 'react'
import {CommentsEnabledContextValue} from './types'

export const CommentsEnabledContext = createContext<CommentsEnabledContextValue | null>(null)
