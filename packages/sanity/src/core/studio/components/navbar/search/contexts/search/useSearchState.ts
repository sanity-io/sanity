import {type SearchContextValue} from './SearchContext'
import {useContext} from 'react'
import {SearchContext} from 'sanity/_singletons'

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
