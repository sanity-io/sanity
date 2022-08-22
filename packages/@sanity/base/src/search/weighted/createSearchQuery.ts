import {compact, flatten, flow, toLower, union, uniq} from 'lodash'
import {joinPath} from '../../util/searchUtils'
import {tokenize} from '../common/tokenize'
import {
  SearchableType,
  SearchOptions,
  SearchPath,
  SearchSpec,
  SearchTerms,
  WeightedSearchOptions,
} from './types'

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

export const DEFAULT_LIMIT = 1000

const combinePaths = flow([flatten, union, compact])

function createSearchSpec(types: SearchableType[], optimizeIndexedPaths) {
  let hasIndexedPaths = false

  const spec = types.map((type) => ({
    typeName: type.name,
    paths: type.__experimental_search.map((config) => {
      const path = config.path.map((p) => {
        if (typeof p === 'number') {
          hasIndexedPaths = true
          // putting [number] in the first filter of a query makes the whole query unoptimized by content-lake,
          // killing performance
          // doing a second filter, after limiting when config contains indexed terms,
          // fixes that at the cost of doubling query payload
          if (optimizeIndexedPaths) {
            return [] as []
          }
        }
        return p
      })
      return {
        weight: config.weight,
        path: joinPath(path),
        mapWith: config.mapWith,
      }
    }),
  }))
  return {
    spec,
    // we only add a second optimization filter if we found indexed paths in __experimental_search config
    hasIndexedPaths,
  }
}

const pathWithMapper = ({mapWith, path}: SearchPath): string =>
  mapWith ? `${mapWith}(${path})` : path

export function createSearchQuery(
  searchTerms: SearchTerms,
  searchOpts: SearchOptions & WeightedSearchOptions = {}
): SearchQuery {
  const {filter, params, tag} = searchOpts

  const {spec: exactSearchSpec, hasIndexedPaths} = createSearchSpec(searchTerms.types, false)

  const terms = uniq(compact(tokenize(toLower(searchTerms.query))))

  function createConstraints(spec: typeof exactSearchSpec) {
    const combinedSearchPaths = combinePaths(
      spec.map((configForType) => configForType.paths.map((opt) => pathWithMapper(opt)))
    )
    const constraints = terms
      .map((term, i) => combinedSearchPaths.map((joinedPath) => `${joinedPath} match $t${i}`))
      .filter((constraint) => constraint.length > 0)

    return constraints.map((constraint) => `(${constraint.join(' || ')})`)
  }

  const optimizedSpec = hasIndexedPaths
    ? createSearchSpec(searchTerms.types, true).spec
    : exactSearchSpec

  const filters = [
    '_type in $__types',
    searchOpts.includeDrafts === false && `!(_id in path('drafts.**'))`,
    ...createConstraints(optimizedSpec),
    filter ? `(${filter})` : '',
  ].filter(Boolean)

  const selections = exactSearchSpec.map((spec) => {
    const constraint = `_type == "${spec.typeName}" => `
    const selection = `{ ${spec.paths.map((cfg, i) => `"w${i}": ${pathWithMapper(cfg)}`)} }`
    return `${constraint}${selection}`
  })

  const selection = selections.length > 0 ? `...select(${selections.join(',\n')})` : ''
  const query =
    `*[${filters.join(' && ')}]` +
    `[$__offset...$__limit]` +
    `${hasIndexedPaths ? `[${createConstraints(exactSearchSpec).join(' && ')}]` : ''}` +
    `{_type, _id, ${selection}}`

  const offset = searchTerms.offset ?? 0
  const limit = (searchTerms.limit ?? searchOpts.limit ?? DEFAULT_LIMIT) + offset

  return {
    query,
    params: {
      ...toGroqParams(terms),
      __types: exactSearchSpec.map((spec) => spec.typeName),
      __limit: limit,
      __offset: offset,
      ...(params || {}),
    },
    options: {tag},
    searchSpec: exactSearchSpec,
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
