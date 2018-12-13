import {flow, compact, flatten, union} from 'lodash'
import client from 'part:@sanity/base/client?'
import schema from 'part:@sanity/base/schema?'
import {joinPath} from '../util/searchUtils'

const combineFields = flow([flatten, union, compact])

function fetchSearchResults(query) {
  if (!client) throw new Error('Sanity client is missing')

  const candidateTypes = schema
    .getTypeNames()
    .filter(typeName => !typeName.startsWith('sanity.'))
    .map(typeName => schema.get(typeName))

  const groqParams = query.terms.reduce(
    (acc, term, i) => {
      acc[`t${i}`] = `${term}*` // "t" is short for term
      return acc
    },
    {
      limit: query.limit || 100
    }
  )

  const groqFilters = query.groqFilters ? query.groqFilters.slice(0) : []

  const uniqueFields = combineFields(
    candidateTypes.map(type => (type.__unstable_searchFields || []).map(joinPath))
  )

  const constraints = query.terms.map((term, i) =>
    uniqueFields.map(joinedPath => `${joinedPath} match $t${i}`)
  )

  groqFilters.push(constraints.map(constraint => `(${constraint.join('||')})`).join('&&'))

  const groqFilterString = `(${groqFilters.join(')&&(')})`

  const groqQuery = `*[${groqFilterString}][0...$limit] {_id, _type}`

  return client.observable.fetch(groqQuery, groqParams)
}

export default fetchSearchResults
