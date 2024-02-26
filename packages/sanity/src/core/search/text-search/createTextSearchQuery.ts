import {type SearchOptions, type SearchTerms, type WeightedSearchOptions} from '../weighted/types'
import {type TextSearchParams} from './types'

export const DEFAULT_LIMIT = 20

// const pathWithMapper = ({mapWith, path}: SearchPath): string =>
//   mapWith ? `${mapWith}(${path})` : path

/**
 * @internal
 */
export function createTextSearchQuery(
  searchTerms: SearchTerms,
  searchOpts: SearchOptions & WeightedSearchOptions = {},
): TextSearchParams {
  const {filter, params} = searchOpts

  // Construct search filters used in this GROQ query
  const filters = [
    '_type in $__types',
    searchOpts.includeDrafts === false && `!(_id in path('drafts.**'))`,
    filter ? `(${filter})` : false,
    searchTerms.filter ? `(${searchTerms.filter})` : false,
  ].filter((baseFilter): baseFilter is string => Boolean(baseFilter))

  // const selections = exactSearchSpecs.map((spec) => {
  //   const constraint = `_type == "${spec.typeName}" => `
  //   const selection = `{ ${spec.paths.map((cfg, i) => `"w${i}": ${pathWithMapper(cfg)}`)} }`
  //   return `${constraint}${selection}`
  // })
  //
  // const projectionFields = ['_type', '_id']
  // const selection = selections.length > 0 ? `...select(${selections.join(',\n')})` : ''
  // const finalProjection = projectionFields.join(', ') + (selection ? `, ${selection}` : '')

  return {
    query: {
      string: searchTerms.query,
    },
    filter: filters.join(' && '),
    params: {
      __types: searchTerms.types.map((type) => type.name),
      ...(params || {}),
    },
    fromCursor: searchOpts.cursor,
    limit: DEFAULT_LIMIT,
  }
}
