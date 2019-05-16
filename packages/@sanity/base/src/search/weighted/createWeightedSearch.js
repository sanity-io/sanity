import {map} from 'rxjs/operators'
import {joinPath} from '../../util/searchUtils'
import {compact, toLower, flatten, uniq, flow, sortBy, union} from 'lodash'
import {removeDupes} from '../../util/draftUtils'
import {applyWeights} from './applyWeights'
import {tokenize} from '../common/tokenize'

const combinePaths = flow([flatten, union, compact])

const isArrayPath = path => path.endsWith('[]')

// "some[].thing[]" => "some[].thing"
const joinedPathRemoveArray = path => path.substr(0, path.length - 2)

const toGroqParams = terms =>
  terms.reduce((acc, term, i) => {
    acc[`t${i}`] = `${term}*` // "t" is short for term
    // For searching in arrays we also need the literal search term
    acc[`tl${i}`] = term
    return acc
  }, {})

export function createWeightedSearch(types, client) {
  const searchSpec = types.map(type => {
    return {
      typeName: type.name,
      paths: type.__experimental_search.map(config => ({
        weight: config.weight,
        path: joinPath(config.path)
      }))
    }
  })

  const combinedSearchPaths = combinePaths(
    searchSpec.map(configForType => configForType.paths.map(opt => opt.path))
  )

  const selections = searchSpec.map(
    spec => `_type == "${spec.typeName}" => {${spec.paths.map((cfg, i) => `"w${i}": ${cfg.path}`)}}`
  )

  // this is the actual search function that takes the search string and returns the hits
  return function search(queryString, opts = {}) {
    const terms = uniq(compact(tokenize(toLower(queryString))))
    const constraints = terms.map((term, i) => (
      combinedSearchPaths.map(joinedPath => {
        // Arrays need to be searched differently
        if (isArrayPath(joinedPath)) {
          return `$tl${i} in ${joinedPathRemoveArray(joinedPath)}`
        }
        return `${joinedPath} match $t${i}`
      })
    ))

    const filters = [
      '_type in $types',
      opts.includeDrafts === false && `!(_id in path('drafts.**'))`,
      ...constraints.map(constraint => `(${constraint.join('||')})`)
    ].filter(Boolean)

    const query = `*[${filters.join('&&')}][0...$limit]{_type, _id, ...select(${selections.join(
      ',\n'
    )})}`

    return client.observable
      .fetch(query, {
        ...toGroqParams(terms),
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
