import {createContext} from 'react'
import {ReviewChangesContextValue} from './types'

/**
 * @internal
 */
export const ReviewChangesContext = createContext<ReviewChangesContextValue | null>(null)
