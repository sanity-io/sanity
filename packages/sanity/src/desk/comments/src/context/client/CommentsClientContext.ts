import {createContext} from 'react'
import {CommentsClientContextValue} from './types'

/**
 * @beta
 * @hidden
 */
export const CommentsClientContext = createContext<CommentsClientContextValue | null>(null)
