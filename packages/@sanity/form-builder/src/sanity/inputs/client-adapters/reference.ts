import {map} from 'rxjs/operators'
import {client, createWeightedSearch, observeForPreview} from '../../../legacyParts'

export function getPreviewSnapshot(value, referenceType) {
  return observeForPreview(value, referenceType).pipe(map((result: any) => result.snapshot))
}

export function search(textTerm, referenceType, options) {
  const doSearch = createWeightedSearch(referenceType.to, client, options)
  return doSearch(textTerm, {includeDrafts: false}).pipe(
    map((results: any[]) => results.map((res) => res.hit))
  )
}
