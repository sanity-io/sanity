import {flow, compact, flatten, union, uniq} from 'lodash'
import client from 'part:@sanity/base/client?'
import schema from 'part:@sanity/base/schema?'
import {
  escapeField,
  fieldNeedsEscape,
  getSearchableTypeNames,
  joinPath
} from 'part:@sanity/base/util/search-utils'

const combineFields = flow([flatten, union, compact])

function mapToEscapedProjectionFieldName(fieldName) {
  if (fieldNeedsEscape(fieldName)) return `"${fieldName}":${escapeField(fieldName)}`

  return fieldName
}

function fetchSearchResults(query, opts = {}) {
  if (!client) throw new Error('Sanity client is missing')

  const typeNames = opts.types || getSearchableTypeNames()
  const types = typeNames.map(typeName => schema.get(typeName))

  const groqParams = query.terms.reduce(
    (acc, term, i) => {
      acc[`t${i}`] = `${term}*` // "t" is short for term
      return acc
    },
    {
      limit: opts.limit || 100
    }
  )

  const groqFilters = query.groqFilters ? query.groqFilters.slice(0) : []

  const uniqueFields = combineFields(
    types.map(type => (type.__unstable_searchFields || []).map(joinPath))
  )

  const constraints = query.terms.map((term, i) =>
    uniqueFields.map(joinedPath => `${joinedPath} match $t${i}`)
  )

  if (constraints.length) {
    groqFilters.push(constraints.map(constraint => `(${constraint.join('||')})`).join('&&'))
  }

  const groqFilterString = `(${groqFilters.join(')&&(')})`

  const fields = uniq(['_id', '_type'].concat(opts.fields || [])).map(
    mapToEscapedProjectionFieldName
  )

  const groqQuery = `*[${groqFilterString}][0...$limit]{${fields.join(',')}}`

  return client.observable.fetch(groqQuery, groqParams)
}

export default fetchSearchResults
