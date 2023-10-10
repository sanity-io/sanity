import {createContext} from 'react'
import {CommentsContextValue} from './types'

export const CommentsContext = createContext<CommentsContextValue | null>(null)
