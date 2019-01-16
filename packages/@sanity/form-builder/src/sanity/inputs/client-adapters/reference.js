import {map} from 'rxjs/operators'
import client from 'part:@sanity/base/client'
import {createWeightedSearch} from 'part:@sanity/base/search/weighted'
import {observeForPreview} from 'part:@sanity/base/preview'

export function getPreviewSnapshot(value, referenceType) {
  return observeForPreview(value, referenceType).pipe(map(result => result.snapshot))
}

export function search(textTerm, referenceType) {
  const forTypes = createWeightedSearch(referenceType.to, client)
  return forTypes(textTerm).pipe(map(results => results.map(res => res.hit)))
}
