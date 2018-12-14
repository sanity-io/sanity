import schema from 'part:@sanity/base/schema'
import fetchSearchResults from 'part:@sanity/base/search/fetchSearchResults'
import parseSearchQuery from 'part:@sanity/base/search/parseSearchQuery'
import prepareSearchResults from 'part:@sanity/base/search/prepareSearchResults'
import {getSearchableTypeNames} from 'part:@sanity/base/util/search-utils'
import {uniq} from 'lodash'
import {map} from 'rxjs/operators'

function getFieldsFromPreviewField(types) {
  return uniq(
    types
      .filter(type => type.preview)
      .filter(type => type.preview.select)
      .map(type => Object.values(type.preview.select))
      .reduce((acc, x) => acc.concat(x), [])
      .filter(titleField => titleField.indexOf('.') === -1)
  )
}

function search(queryStr, opts = {}) {
  const query = parseSearchQuery(queryStr, opts)

  const typeNames = opts.types || getSearchableTypeNames()
  const types = typeNames.map(typeName => schema.get(typeName))

  opts.fields = getFieldsFromPreviewField(types)

  const limit = Math.max(opts.limit || 100, 1000)

  const fetchOpts = {...opts, limit}

  return fetchSearchResults(query, fetchOpts).pipe(
    map(results => prepareSearchResults(results, query, opts))
  )
}

export default search
