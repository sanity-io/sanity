import {createContext} from 'react'
import {CommentsUpsellContextValue} from './types'

/**
 * @beta
 * @hidden
 */
export const CommentsUpsellContext = createContext<CommentsUpsellContextValue | null>(null)
