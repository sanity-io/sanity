import {useContext} from 'react'

import {ReviewChangesContext} from './ReviewChangesContext'
import {type ReviewChangesContextValue} from './types'

/**
 * @internal
 */
export function useReviewChanges(): ReviewChangesContextValue {
  const reviewChanges = useContext(ReviewChangesContext)

  if (!reviewChanges) {
    throw new Error('Review changes: missing context value')
  }

  return reviewChanges
}
