/* eslint-disable import/prefer-default-export */
import type {SanityClient} from '@sanity/client'
import type {ObjectSchemaType} from '@sanity/types'
import type {Observable} from 'rxjs'
import {compact, toLower, flatten, uniq, flow, sortBy, union} from 'lodash'
import {map, tap} from 'rxjs/operators'
import {joinPath} from '../../util/searchUtils'
import {tokenize} from '../common/tokenize'
import {removeDupes} from '../../util/draftUtils'
import {applyWeights} from './applyWeights'
import {
  WeightedHit,
  WeightedSearchOptions,
  SearchOptions,
  SearchPath,
  SearchHit,
  SearchSpec,
} from './types'

const combinePaths = flow([flatten, union, compact])

const toGroqParams = (terms: string[]): Record<string, string> => {
  const params: Record<string, string> = {}
  return terms.reduce((acc, term, i) => {
    acc[`t${i}`] = `${term}*` // "t" is short for term
    return acc
  }, params)
}

const pathWithMapper = ({mapWith, path}: SearchPath): string =>
  mapWith ? `${mapWith}(${path})` : path

export function createWeightedSearch(
  // eslint-disable-next-line camelcase
  types: {name: string; __experimental_search?: ObjectSchemaType['__experimental_search']}[],
  client: SanityClient,
  options: WeightedSearchOptions = {}
): (query: string, opts?: SearchOptions) => Observable<WeightedHit[]> {
  if (!types) {
    throw new Error('missing types')
  }

  const {filter, params, tag} = options
  const searchSpec: SearchSpec[] = types.map((type) => ({
    typeName: type.name,
    paths: type.__experimental_search?.map((config) => ({
      weight: config.weight,
      path: joinPath(config.path),
      mapWith: config.mapWith,
    })),
  }))

  const combinedSearchPaths = combinePaths(
    searchSpec.map((configForType) => configForType.paths?.map((opt) => pathWithMapper(opt)))
  )

  const selections = searchSpec.map((spec) => {
    const constraint = `_type == "${spec.typeName}" => `
    const selection = `{ ${spec.paths?.map((cfg, i) => `"w${i}": ${pathWithMapper(cfg)}`)} }`
    return `${constraint}${selection}`
  })

  // this is the actual search function that takes the search string and returns the hits
  return function search(queryString: string, searchOpts: SearchOptions = {}) {
    const terms = uniq(compact(tokenize(toLower(queryString))))
    const constraints = terms
      .map((term, i) => combinedSearchPaths.map((joinedPath: any) => `${joinedPath} match $t${i}`))
      .filter((constraint) => constraint.length > 0)

    const filters = [
      '_type in $__types',
      searchOpts.includeDrafts === false && `!(_id in path('drafts.**'))`,
      ...constraints.map((constraint) => `(${constraint.join('||')})`),
      filter ? `(${filter})` : '',
    ].filter(Boolean)

    const selection = selections.length > 0 ? `...select(${selections.join(',\n')})` : ''
    const query = `*[${filters.join('&&')}][0...$__limit]{_type, _id, ${selection}}`

    return client.observable
      .fetch(
        query,
        {
          ...toGroqParams(terms),
          __types: searchSpec.map((spec) => spec.typeName),
          __limit: searchOpts.limit ?? 1000,
          ...(params || {}),
        },
        {tag}
      )
      .pipe(
        options.unique ? map(removeDupes) : tap(),
        map((hits: SearchHit[]) => applyWeights(searchSpec, hits, terms)),
        map((hits) => sortBy(hits, (hit) => -hit.score))
      )
  }
}
