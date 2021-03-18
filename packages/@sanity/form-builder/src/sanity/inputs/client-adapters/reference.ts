import {map} from 'rxjs/operators'
import {createWeightedSearch, observeForPreview} from '../../../legacyParts'
import {versionedClient} from '../../versionedClient'

export function getPreviewSnapshot(value, referenceType) {
  return observeForPreview(value, referenceType).pipe(map((result: any) => result.snapshot))
}

export function search(textTerm, referenceType, options) {
  const doSearch = createWeightedSearch(referenceType.to, versionedClient, options)
  return doSearch(textTerm, {includeDrafts: false}).pipe(
    map((results: any[]) => results.map((res) => res.hit))
  )
}
