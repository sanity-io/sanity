import fetchSearchResults from 'part:@sanity/base/search/fetchSearchResults'
import parseSearchQuery from 'part:@sanity/base/search/parseSearchQuery'
import prepareSearchResults from 'part:@sanity/base/search/prepareSearchResults'
import {map} from 'rxjs/operators'

function search(queryStr, opts) {
  const query = parseSearchQuery(queryStr, opts)

  return fetchSearchResults(query, opts).pipe(
    map(results => prepareSearchResults(results, query, opts))
  )
}

export default search
