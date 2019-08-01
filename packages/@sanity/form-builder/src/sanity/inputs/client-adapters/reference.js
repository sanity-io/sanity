import {map, scan, filter} from 'rxjs/operators'
import {merge} from 'rxjs'
import client from 'part:@sanity/base/client'
import {createWeightedSearch} from 'part:@sanity/base/search/weighted'
import {observeForPreview} from 'part:@sanity/base/preview'
import {getDraftId, getPublishedId} from 'part:@sanity/base/util/draft-utils'

export function getPreviewSnapshot(value, referenceType) {
  return merge(
    observeForPreview({_ref: getPublishedId(value._ref)}, referenceType).pipe(
      map(result => ({published: result.snapshot}))
    ),
    observeForPreview({_ref: getDraftId(value._ref)}, referenceType).pipe(
      map(result => ({draft: result.snapshot}))
    )
  ).pipe(
    scan((acc, res) => ({...acc, ...res}), {}),
    filter(res => 'draft' in res && 'published' in res),
    map(res => res.published || res.draft)
  )
}

export function search(textTerm, referenceType) {
  const doSearch = createWeightedSearch(referenceType.to, client)
  return doSearch(textTerm, {includeDrafts: true}).pipe(map(results => results.map(res => res.hit)))
}
