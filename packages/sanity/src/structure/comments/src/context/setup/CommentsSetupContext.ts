import {createContext} from 'react'
import {CommentsSetupContextValue} from './types'

/**
 * @beta
 * @hidden
 */
export const CommentsSetupContext = createContext<CommentsSetupContextValue | null>(null)
