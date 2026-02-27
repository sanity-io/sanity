import {useContext, useMemo} from 'react'
import {ReviewChangesContext} from 'sanity/_singletons'

import {type ConnectorContextValue} from '../changeIndicators/ConnectorContext'

interface ReviewChangesContextValue extends ConnectorContextValue {
  /**
   * @deprecated use `isReviewChangesOpen` instead, this will be removed in the next major version
   */
  changesOpen?: boolean
}

/**
 * @internal
 */
export function useReviewChanges(): ReviewChangesContextValue {
  const context = useContext(ReviewChangesContext)

  return useMemo(() => {
    return {
      ...context,
      changesOpen: context.isReviewChangesOpen,
    }
  }, [context])
}
