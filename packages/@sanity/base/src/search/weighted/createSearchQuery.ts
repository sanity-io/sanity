import type {ObjectSchemaType} from '@sanity/types'
import {compact, flatten, flow, toLower, union, uniq} from 'lodash'
import {joinPath} from '../../util/searchUtils'
import {tokenize} from '../common/tokenize'
import {SearchOptions, SearchPath, SearchSpec, SearchTerms, WeightedSearchOptions} from './types'

export interface SearchParams {
  __types: string[]
  __limit: number
  __offset: number
  [key: string]: unknown
}

export interface SearchQuery {
  query: string
  params: SearchParams
  options: Record<string, unknown>
  searchSpec: SearchSpec[]
  terms: string[]
}

type ObjectSchema = {
  name: string
  // eslint-disable-next-line camelcase
  __experimental_search: ObjectSchemaType['__experimental_search']
}

export const DEFAULT_LIMIT = 1000

const combinePaths = flow([flatten, union, compact])

const pathWithMapper = ({mapWith, path}: SearchPath): string =>
  mapWith ? `${mapWith}(${path})` : path

export function createSearchQuery(
  searchTerms: Omit<SearchTerms, 'types'> & {types: ObjectSchema[]},
  searchOpts: SearchOptions & WeightedSearchOptions = {}
): SearchQuery {
  const {filter, params, tag} = searchOpts

  const searchSpec = searchTerms.types.map((type) => ({
    typeName: type.name,
    paths: type.__experimental_search.map((config) => ({
      weight: config.weight,
      path: joinPath(config.path),
      mapWith: config.mapWith,
    })),
  }))

  const combinedSearchPaths = combinePaths(
    searchSpec.map((configForType) => configForType.paths.map((opt) => pathWithMapper(opt)))
  )

  const selections = searchSpec.map((spec) => {
    const constraint = `_type == "${spec.typeName}" => `
    const selection = `{ ${spec.paths.map((cfg, i) => `"w${i}": ${pathWithMapper(cfg)}`)} }`
    return `${constraint}${selection}`
  })

  const terms = uniq(compact(tokenize(toLower(searchTerms.query))))
  const constraints = terms
    .map((term, i) => combinedSearchPaths.map((joinedPath) => `${joinedPath} match $t${i}`))
    .filter((constraint) => constraint.length > 0)

  const filters = [
    '_type in $__types',
    searchOpts.includeDrafts === false && `!(_id in path('drafts.**'))`,
    ...constraints.map((constraint) => `(${constraint.join(' || ')})`),
    filter ? `(${filter})` : '',
  ].filter(Boolean)

  const selection = selections.length > 0 ? `...select(${selections.join(',\n')})` : ''
  const query = `*[${filters.join(' && ')}][$__offset...$__limit]{_type, _id, ${selection}}`

  const offset = searchTerms.offset ?? 0
  const limit = (searchTerms.limit ?? searchOpts.limit ?? DEFAULT_LIMIT) + offset

  return {
    query,
    params: {
      ...toGroqParams(terms),
      __types: searchSpec.map((spec) => spec.typeName),
      __limit: limit,
      __offset: offset,
      ...(params || {}),
    },
    options: {tag},
    searchSpec,
    terms,
  }
}

const toGroqParams = (terms: string[]): Record<string, string> => {
  const params: Record<string, string> = {}
  return terms.reduce((acc, term, i) => {
    acc[`t${i}`] = `${term}*` // "t" is short for term
    return acc
  }, params)
}
