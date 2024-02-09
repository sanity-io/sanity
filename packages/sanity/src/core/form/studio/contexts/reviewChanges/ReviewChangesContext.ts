import {createContext} from 'react'

import {type ReviewChangesContextValue} from './types'

/**
 * @internal
 */
export const ReviewChangesContext = createContext<ReviewChangesContextValue | null>(null)
