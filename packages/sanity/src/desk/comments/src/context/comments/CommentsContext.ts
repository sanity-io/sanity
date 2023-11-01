import {createContext} from 'react'
import {CommentsContextValue} from './types'

/**
 * @beta
 * @hidden
 */
export const CommentsContext = createContext<CommentsContextValue | null>(null)
