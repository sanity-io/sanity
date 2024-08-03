import {createContext} from 'sanity/_createContext'

import type {ReviewChangesContextValue} from '../../core/form/studio/contexts/reviewChanges/types'

/**
 * @internal
 */
export const ReviewChangesContext = createContext<ReviewChangesContextValue | null>(
  'sanity/_singletons/context/review-changes',
  null,
)
