/* eslint-disable import/prefer-default-export */
import type {SanityClient} from '@sanity/client'
import type {ObjectSchemaType} from '@sanity/types'
import type {Observable} from 'rxjs'
import sortBy from 'lodash/sortBy'
import {map, tap} from 'rxjs/operators'
import {removeDupes} from '../../util/draftUtils'
import {applyWeights} from './applyWeights'
import {SearchHit, SearchOptions, SearchTerms, WeightedHit, WeightedSearchOptions} from './types'
import {createSearchQuery} from './createSearchQuery'

type ObjectSchema = {
  name: string
  // eslint-disable-next-line camelcase
  __experimental_search: ObjectSchemaType['__experimental_search']
}

type SearchFunction = (
  searchTerms: string | SearchTerms,
  searchOpts?: SearchOptions,
  searchComments?: string[]
) => Observable<WeightedHit[]>

function getSearchTerms(
  searchParams: string | SearchTerms,
  types: ObjectSchema[]
): Omit<SearchTerms, 'types'> & {types: ObjectSchema[]} {
  if (typeof searchParams === 'string') {
    return {
      query: searchParams,
      types: types,
    }
  }
  return searchParams.types.length ? searchParams : {...searchParams, types}
}

export function createWeightedSearch(
  types: ObjectSchema[],
  client: SanityClient,
  commonOpts: WeightedSearchOptions = {}
): SearchFunction {
  // this is the actual search function that takes the search string and returns the hits
  // supports string as search param to be backwards compatible
  return function search(searchParams, searchOpts = {}, searchComments = []) {
    const searchTerms = getSearchTerms(searchParams, types)
    const {query, params, options: o, searchSpec, terms} = createSearchQuery(searchTerms, {
      ...commonOpts,
      ...searchOpts,
    })

    // Prepend optional GROQ comments to query
    const groqComments = searchComments.map((s) => `// ${s}`).join('\n')
    const updatedQuery = groqComments ? `${groqComments}\n${query}` : query

    return client.observable.fetch(updatedQuery, params, o).pipe(
      commonOpts.unique ? map(removeDupes) : tap(),
      map((hits: SearchHit[]) => applyWeights(searchSpec, hits, terms)),
      map((hits) => sortBy(hits, (hit) => -hit.score))
    )
  }
}
