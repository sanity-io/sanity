import documentStore from 'part:@sanity/base/datastore/document'
import client from 'part:@sanity/base/client'
import {createHookFromObservableFactory, getPublishedId} from '@sanity/base/_internal'
import {Observable, timer, fromEvent, EMPTY} from 'rxjs'
import {map, startWith, distinctUntilChanged, switchMap, shareReplay, tap} from 'rxjs/operators'

const POLL_INTERVAL = 5000
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
  ),
  shareReplay({refCount: true, bufferSize: 1})
)

export type ReferringDocuments = {
  isLoading: boolean
  total: number
  internalReferences?: {
    totalCount: number
    references: Array<{_id: string; _type: string}>
  }
  crossDatasetReferences?: {
    totalCount: number
    references: Array<{id: string; projectId: string; datasetName: string}>
  }
}

function fetchExternalReferences(
  documentId: string
): Observable<ReferringDocuments['crossDatasetReferences']> {
  return visiblePoll$.pipe(
    switchMap(() =>
      client.withConfig({apiVersion: 'X'}).observable.request({
        url: `/data/references/playground/documents/${documentId}/to?excludeInternalReferences=true&excludePaths=true`,
      })
    )
  )
}

const useInternalReferences = createHookFromObservableFactory((documentId: string) => {
  const referencesClause = '*[references($documentId)][0...100]{_id,_type}'
  const totalClause = 'count(*[references($documentId)])'

  return documentStore.listenQuery(
    `{"references":${referencesClause},"totalCount":${totalClause}}`,
    {documentId},
    {tag: 'use-referring-documents'}
  ) as Observable<ReferringDocuments['internalReferences']>
})

const useCrossDatasetReferences = createHookFromObservableFactory((documentId: string) => {
  return visiblePoll$.pipe(switchMap(() => fetchExternalReferences(documentId)))
})

export function useReferringDocuments(documentId: string): ReferringDocuments {
  const publishedId = getPublishedId(documentId)
  const [internalReferences, isInternalReferencesLoading] = useInternalReferences(publishedId)
  const [crossDatasetReferences, isCrossDatasetReferencesLoading] = useCrossDatasetReferences(
    publishedId
  )

  return {
    total: (internalReferences?.totalCount || 0) + (crossDatasetReferences?.totalCount || 0),
    internalReferences,
    crossDatasetReferences,
    isLoading: isInternalReferencesLoading || isCrossDatasetReferencesLoading,
  }
}
