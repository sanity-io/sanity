import {map} from 'rxjs/operators'
import {joinPath, getMatchingOperatorForType, getTypedTermValue, getUsedTermTypes} from '../../util/searchUtils'
import {compact, toLower, flatten, uniq, flow, sortBy, union} from 'lodash'
import {removeDupes} from '../../util/draftUtils'
import {applyWeights} from './applyWeights'
import {tokenize} from '../common/tokenize'

const combinePaths = flow([flatten, union, compact])
const combineTermTypes = flow([flatten, uniq])

// "t" is short for term
const typedTerm = (term, type) => `t${term}${type.charAt(0)}`

const toGroqParams = (terms, termTypes) =>
  terms.reduce((acc, term, i) => {
    termTypes[term].forEach(type => {
      acc[typedTerm(i, type)] = getTypedTermValue(term, type)
    })
    return acc
  }, {})

export function createWeightedSearch(types, client) {
  const searchSpec = []
  const operatorMap = {}

  types.forEach(type => {
    const typePaths = []

    // Extract operators and add path to spec
    type.__experimental_search.forEach(config => {
      const path = joinPath(config.path)
      const valueType = config.type || 'string'

      if (!(path in operatorMap)) {
        operatorMap[path] = []
      }

      const operator = getMatchingOperatorForType(valueType)

      // Add operator for path and guard against duplicates
      if (!operatorMap[path].some(o => o.type === valueType && o.operator === operator)) {
        operatorMap[path].push({type: valueType, operator})
      }

      // Add path to spec
      typePaths.push({
        weight: config.weight,
        path
      })
    })

    // Commit spec
    searchSpec.push({
      typeName: type.name,
      paths: typePaths
    })
  })

  const combinedSearchPaths = combinePaths(
    searchSpec.map(configForType => configForType.paths.map(opt => opt.path))
  )

  const searchPathsWithOptions = combinedSearchPaths.reduce((accumulation, joinedPath) => {
    operatorMap[joinedPath].forEach(operator => accumulation.push({joinedPath, ...operator}))
    return accumulation
  }, [])
  
  // Collect all types available to search
  const termTypes = combineTermTypes(Object.keys(operatorMap).map(path => operatorMap[path].map(operator => operator.type)))

  const selections = searchSpec.map(
    spec => `_type == "${spec.typeName}" => {${spec.paths.map((cfg, i) => `"w${i}": ${cfg.path}`)}}`
  )

  // this is the actual search function that takes the search string and returns the hits
  return function search(queryString, opts = {}) {
    const terms = uniq(compact(tokenize(toLower(queryString))))
    const usedTermTypes = getUsedTermTypes(terms, termTypes)
    const constraints = terms
      .map((term, i) =>
        searchPathsWithOptions
          .filter(({ type }) => usedTermTypes[term].includes(type))
          .map(({joinedPath, operator, type}) => `${joinedPath} ${operator} $${typedTerm(i, type)}`)
      )
      .filter(constraint => constraint.length > 0)

    const filters = [
      '_type in $types',
      opts.includeDrafts === false && `!(_id in path('drafts.**'))`,
      ...constraints.map(constraint => `(${constraint.join('||')})`)
    ].filter(Boolean)

    const selection = selections.length > 0 ? `...select(${selections.join(',\n')})` : ''
    const query = `*[${filters.join('&&')}][0...$limit]{_type, _id, ${selection}}`

    return client.observable
      .fetch(query, {
        ...toGroqParams(terms, usedTermTypes),
        types: searchSpec.map(spec => spec.typeName),
        limit: 1000
      })
      .pipe(
        map(removeDupes),
        map(hits => applyWeights(searchSpec, hits, terms)),
        map(hits => sortBy(hits, hit => -hit.score)),
        map(hits => hits.slice(0, 100))
      )
  }
}
