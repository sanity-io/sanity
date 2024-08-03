import {createContext} from 'react'

import type {ReviewChangesContextValue} from '../../../../../core/form/studio/contexts/reviewChanges/types'

/**
 * @internal
 */
export const ReviewChangesContext = createContext<ReviewChangesContextValue | null>(null)
