import {useContext} from 'react'

import {SearchContext, type SearchContextValue} from './SearchContext'

/**
 * @internal
 */
export function useSearchState(): SearchContextValue {
  const context = useContext(SearchContext)

  if (context === undefined) {
    throw new Error('useSearchState must be used within an SearchProvider')
  }
  return context
}
