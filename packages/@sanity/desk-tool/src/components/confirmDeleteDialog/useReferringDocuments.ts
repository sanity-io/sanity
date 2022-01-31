import documentStore from 'part:@sanity/base/datastore/document'
import {createHookFromObservableFactory, getPublishedId} from '@sanity/base/_internal'
import {Observable, of, timer, fromEvent, EMPTY} from 'rxjs'
import {delay, map, startWith, distinctUntilChanged, switchMap} from 'rxjs/operators'

const POLL_INTERVAL = 5000

export type ReferringDocuments = {
  isLoading: boolean
  total: number
  internalReferences?: {
    total: number
    references: Array<{_id: string; _type: string}>
  }
  crossDatasetReferences?: {
    total: number
    references: Array<{id: string; projectId: string; dataset: string}>
  }
}

// TODO: remove this implementation
function stubFetchExternalReferences(
  // eslint-disable-next-line
  _documentId: string
): Observable<ReferringDocuments['crossDatasetReferences']> {
  const references = Array.from({length: 25}).flatMap(() => [
    {id: '7bbbded8-4fdf-47d8-b85f-46c8eca793a5', projectId: 'fooProject', dataset: 'fooDataset'},
    {id: '7bbbded8-4fdf-47d8-b85f-46c8eca793a5', projectId: 'barProject', dataset: 'barData'},
  ])

  return of({
    total: references.length,
    references,
  }).pipe(delay(1000))
}

const useInternalReferences = createHookFromObservableFactory((documentId: string) => {
  const referencesClause = '*[references($documentId)][0...100]{_id,_type}'
  const totalClause = 'count(*[references($documentId)])'

  return documentStore.listenQuery(
    `{"references":${referencesClause},"total":${totalClause}}`,
    {documentId},
    {tag: 'use-referring-documents'}
  ) as Observable<ReferringDocuments['internalReferences']>
})

const useCrossDatasetReferences = createHookFromObservableFactory((documentId: string) => {
  // only fetches when the document is visible
  const visiblePoll$ = fromEvent(document, 'visibilitychange').pipe(
    // add empty emission to have this fire on creation
    startWith(null),
    map(() => document.visibilityState === 'visible'),
    distinctUntilChanged(),
    switchMap((visible) =>
      visible
        ? // using timer instead of interval since timer will emit on creation
          timer(0, POLL_INTERVAL)
        : EMPTY
    )
  )

  return visiblePoll$.pipe(switchMap(() => stubFetchExternalReferences(documentId)))
})

export function useReferringDocuments(documentId: string): ReferringDocuments {
  const publishedId = getPublishedId(documentId)
  const [internalReferences, isInternalReferencesLoading] = useInternalReferences(publishedId)
  const [crossDatasetReferences, isCrossDatasetReferencesLoading] = useCrossDatasetReferences(
    publishedId
  )

  return {
    total: (internalReferences?.total || 0) + (crossDatasetReferences?.total || 0),
    internalReferences,
    crossDatasetReferences,
    isLoading: isInternalReferencesLoading || isCrossDatasetReferencesLoading,
  }
}
