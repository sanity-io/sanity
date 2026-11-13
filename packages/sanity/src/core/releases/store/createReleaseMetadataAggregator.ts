import {type MutationEvent, type SanityClient} from '@sanity/client'
import {type DocumentSystem, type SanityDocument} from '@sanity/types'
import {
  bufferTime,
  catchError,
  concatMap,
  defer,
  EMPTY,
  filter,
  forkJoin,
  iif,
  map,
  merge,
  mergeMap,
  type Observable,
  of,
  startWith,
  switchMap,
  tap,
} from 'rxjs'

import {getVersionFromId} from '../../util/draftUtils'
import {getReleaseDocumentIdFromReleaseId} from '../util/getReleaseDocumentIdFromReleaseId'
import {getReleaseIdFromReleaseDocumentId} from '../util/getReleaseIdFromReleaseDocumentId'
import {type ReleasesMetadata} from './useReleasesMetadata'

export type ReleasesMetadataMap = Record<string, ReleasesMetadata>

export type MetadataWrapper = {data: ReleasesMetadataMap | null; error: null; loading: boolean}

const getFetchQuery = (releaseIds: string[]) => {
  // projection key must be string - cover the case that a bundle has a number as first char
  const getSafeKey = (id: string) => `release_${id.replaceAll('-', '_')}`

  return releaseIds.reduce(
    ({subquery: accSubquery, projection: accProjection}, releaseId) => {
      const bundleId = getReleaseIdFromReleaseDocumentId(releaseId)
      // get a version of the id that is safe to use as key in objects
      const safeId = getSafeKey(bundleId)

      const subquery = `${accSubquery}"${safeId}": *[sanity::partOfRelease("${bundleId}")]{_updatedAt, "docId": string::split(_id, ".")[2] } | order(_updatedAt desc),`

      const projection = `${accProjection}"${releaseId}": {
              "updatedAt": ${safeId}[0]._updatedAt,
              "documentIds": ${safeId}[].docId,
            },`

      return {subquery, projection}
    },
    {subquery: '', projection: ''},
  )
}

/**
 * @internal
 *
 * An initial fetch is made. This fetch is polled whenever a listener even is emitted
 * Only releases that have been mutated are re-fetched
 *
 * @returns an Observable that accepts a list of release slugs and returns a stream of metadata
 */
export const createReleaseMetadataAggregator = (client: SanityClient | null) => {
  // Turned off by the first failed history lookup, so a user who can't read history makes that
  // request once per session instead of once per deleted variant document
  let canReadHistory = true

  const aggregatorFetch$ = (
    releaseIds: string[],
    isInitialLoad: boolean = false,
  ): Observable<MetadataWrapper> => {
    if (!releaseIds?.length || !client) return of({data: null, error: null, loading: false})

    const {subquery: queryAllDocumentsInReleases, projection: projectionToBundleMetadata} =
      getFetchQuery(releaseIds)

    const fetchData$ = client.observable
      .fetch<
        Record<
          string,
          Omit<ReleasesMetadata, 'existingDocumentCount'> & {
            documentIds: string[]
          }
        >
      >(
        `{${queryAllDocumentsInReleases}}{${projectionToBundleMetadata}}`,
        {},
        {tag: 'release-docs.fetch'},
      )
      .pipe(
        switchMap((releaseDocumentIdResponse) =>
          of({
            data: Object.entries(releaseDocumentIdResponse).reduce((existing, el) => {
              const [releaseId, metadata] = el
              return {
                ...existing,
                [releaseId]: {...metadata, documentCount: metadata.documentIds?.length || 0},
              }
            }, {}),
            error: null,
            loading: false,
          }),
        ),
        catchError((error) => {
          console.error('Failed to fetch release metadata', error)
          return of({data: null, error, loading: false})
        }),
      )

    // initially emit loading empty state if first fetch
    return iif(
      () => isInitialLoad,
      fetchData$.pipe(startWith({loading: true, data: null, error: null})),
      fetchData$,
    )
  }

  const mutatedReleaseDocumentIds$ = (releaseDocumentIds: string[]): Observable<string[]> => {
    if (!client) return EMPTY

    const releaseIds = releaseDocumentIds.map(getReleaseIdFromReleaseDocumentId)

    // A document whose `_system` names an unwatched release, or none (a variant of published),
    // resolves to no release; one without `_system` can't tell, so it resolves to all of them
    const getWatchedReleaseDocumentIds = (
      system: Partial<DocumentSystem> | undefined,
    ): string[] => {
      if (!system) return releaseDocumentIds
      const {release, bundleId} = system
      const releaseDocumentId =
        release?._ref ?? (bundleId ? getReleaseDocumentIdFromReleaseId(bundleId) : undefined)
      return releaseDocumentId && releaseDocumentIds.includes(releaseDocumentId)
        ? [releaseDocumentId]
        : []
    }

    // The id of a release-scoped variant document carries an opaque hash instead of the release
    // id, so its release is read from `_system`: on the result, or in history once it is deleted
    const getMutatedReleaseDocumentIds = (event: MutationEvent): Observable<string[]> => {
      const releaseId = getVersionFromId(event.documentId)
      if (releaseId && releaseIds.includes(releaseId)) {
        return of([getReleaseDocumentIdFromReleaseId(releaseId)])
      }
      if (event.transition !== 'disappear') {
        return of(getWatchedReleaseDocumentIds(event.result?._system))
      }
      const {documentId, previousRev} = event
      if (!previousRev || !canReadHistory) return of(releaseDocumentIds)

      const searchParams = new URLSearchParams({revision: previousRev})
      return client.observable
        .request<{documents: SanityDocument[]}>({
          url: `/data/history/${client.config().dataset}/documents/${documentId}?${searchParams}`,
          tag: 'get-document-revision',
        })
        .pipe(
          map(({documents}) => getWatchedReleaseDocumentIds(documents[0]?._system)),
          catchError(() => {
            canReadHistory = false
            return of(releaseDocumentIds)
          }),
        )
    }

    return client.observable
      .listen(
        `*[(${releaseIds.reduce(
          (accQuery, releaseId, index) =>
            `${accQuery}${index === 0 ? '' : ' ||'} sanity::partOfRelease("${releaseId}")`,
          '',
        )})]`,
        {},
        {
          includeResult: true,
          includeAllVersions: true,
          visibility: 'query',
          events: ['mutation'],
          tag: 'release-docs.listen',
        },
      )
      .pipe(
        catchError((error) => {
          console.error('Failed to listen for release metadata', error)
          return EMPTY
        }),
        bufferTime(1_000),
        filter((entriesArray) => entriesArray.length > 0),
        // Not `switchMap`: a later batch must not cancel the history lookups of an earlier one
        mergeMap((entriesArray) =>
          forkJoin(
            entriesArray.flatMap((event) =>
              'type' in event && event.type === 'mutation'
                ? [getMutatedReleaseDocumentIds(event)]
                : [],
            ),
          ).pipe(map((releaseDocumentIdsPerEvent) => releaseDocumentIdsPerEvent.flat())),
        ),
      )
  }

  return (releaseDocumentIds: string[]) => {
    if (!releaseDocumentIds?.length || !client) return aggregatorFetch$(releaseDocumentIds)

    // One fetch at a time, so an older response can't overwrite a newer one. The releases that
    // change while a fetch is in flight are collected here and fetched together once it completes
    const pendingReleaseDocumentIds = new Set<string>()

    return merge(of(releaseDocumentIds), mutatedReleaseDocumentIds$(releaseDocumentIds)).pipe(
      tap((mutatedReleaseDocumentIds) => {
        for (const releaseDocumentId of mutatedReleaseDocumentIds) {
          pendingReleaseDocumentIds.add(releaseDocumentId)
        }
      }),
      concatMap((_, fetchIndex) =>
        defer(() => {
          if (!pendingReleaseDocumentIds.size) return EMPTY
          const fetchedReleaseDocumentIds = [...pendingReleaseDocumentIds]
          pendingReleaseDocumentIds.clear()
          return aggregatorFetch$(fetchedReleaseDocumentIds, fetchIndex === 0)
        }),
      ),
    )
  }
}
