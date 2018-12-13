import fetchSearchResults from 'part:@sanity/base/search/fetchSearchResults'
import parseSearchQuery from 'part:@sanity/base/search/parseSearchQuery'
import prepareSearchResults from 'part:@sanity/base/search/prepareSearchResults'
import {map} from 'rxjs/operators'

function search(queryStr) {
  const query = parseSearchQuery(queryStr)

  return fetchSearchResults(query).pipe(map(results => prepareSearchResults(results, query)))
}

export default search
