/* eslint-disable import/prefer-default-export */
import type {SanityClient} from '@sanity/client'
import type {Observable} from 'rxjs'
import sortBy from 'lodash/sortBy'
import {map, tap} from 'rxjs/operators'
import {removeDupes} from '../../util/draftUtils'
import {applyWeights} from './applyWeights'
import {
  SearchableType,
  SearchHit,
  SearchOptions,
  SearchTerms,
  WeightedHit,
  WeightedSearchOptions,
} from './types'
import {createSearchQuery} from './createSearchQuery'

type SearchFunction = (
  searchTerms: string | SearchTerms,
  searchOpts?: SearchOptions,
  searchComments?: string[]
) => Observable<WeightedHit[]>

function getSearchTerms(
  searchParams: string | SearchTerms,
  types: SearchableType[]
): Omit<SearchTerms, 'types'> & {types: SearchableType[]} {
  if (typeof searchParams === 'string') {
    return {
      query: searchParams,
      types: types,
    }
  }
  return searchParams.types.length ? searchParams : {...searchParams, types}
}

export function createWeightedSearch(
  types: SearchableType[],
  client: SanityClient,
  commonOpts: WeightedSearchOptions = {}
): SearchFunction {
  // this is the actual search function that takes the search string and returns the hits
  // supports string as search param to be backwards compatible
  return function search(searchParams, searchOpts = {}, searchComments = []) {
    const searchTerms = getSearchTerms(searchParams, types)
    const {query, params, options, searchSpec, terms} = createSearchQuery(searchTerms, {
      ...commonOpts,
      ...searchOpts,
    })

    // Prepend optional GROQ comments to query
    const groqComments = searchComments.map((s) => `// ${s}`).join('\n')
    const updatedQuery = groqComments ? `${groqComments}\n${query}` : query

    return client.observable.fetch(updatedQuery, params, options).pipe(
      commonOpts.unique ? map(removeDupes) : tap(),
      map((hits: SearchHit[]) => applyWeights(searchSpec, hits, terms)),
      map((hits) => sortBy(hits, (hit) => -hit.score))
    )
  }
}
