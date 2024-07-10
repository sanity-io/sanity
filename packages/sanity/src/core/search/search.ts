import {parse} from 'groq-js'

import {
  type SearchStrategyFactory,
  type TextSearchResults,
  type WeightedSearchResults,
} from './common'
import {createTextSearch} from './text-search'
import {groqExpressionIsTextSearchCompatible} from './utils/groq'
import {createWeightedSearch} from './weighted'

/** @internal */
export const createSearch: SearchStrategyFactory<TextSearchResults | WeightedSearchResults> = (
  searchableTypes,
  client,
  options,
) => {
  // Studio's filtering APIs allow developers to use any GROQ operation, but unfortunately, the
  // Text Search API does not provide a full GROQ implementation for filtering. Notably, it
  // currently lacks support for dereferences, subqueries, and some function calls.
  //
  // If the filter includes any such operation, the legacy search strategy will instead be used.
  //
  // This does have some implications for the end user. For example, the legacy search API doesn't
  // support negations (e.g. `-word`). We warn in the console to make developers aware.
  const isTextSearchApiCompatible =
    !options.filter || groqExpressionIsTextSearchCompatible(parse(options.filter))

  if (!options.enableLegacySearch && !isTextSearchApiCompatible) {
    console.warn(
      `Using legacy search because custom filter contains subquery: \`${options.filter}\`.`,
    )
  }

  const factory =
    options.enableLegacySearch || !isTextSearchApiCompatible
      ? createWeightedSearch
      : createTextSearch

  return factory(searchableTypes, client, options)
}
