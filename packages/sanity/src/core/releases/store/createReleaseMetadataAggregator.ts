import {type SanityClient} from '@sanity/client'
import {
  bufferTime,
  catchError,
  EMPTY,
  filter,
  iif,
  merge,
  type Observable,
  of,
  startWith,
  switchMap,
} from 'rxjs'

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

      const subquery = `${accSubquery}"${safeId}": *[_id in path("versions.${bundleId}.*")]{_updatedAt, "docId": string::split(_id, ".")[2] } | order(_updatedAt desc),`

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

  const aggregatorListener$ = (releaseIds: string[]) => {
    if (!releaseIds?.length || !client) return EMPTY

    return client.observable
      .listen(
        `*[(${releaseIds.reduce(
          (accQuery, releaseId, index) =>
            `${accQuery}${index === 0 ? '' : ' ||'} _id in path("versions.${releaseId}.**")`,
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
        switchMap((entriesArray) => {
          const mutatedReleaseIds = entriesArray.reduce<string[]>((accReleaseIds, event) => {
            if ('type' in event && event.type === 'mutation') {
              const releaseId = event.documentId.split('.')[1]
              // de-dup mutated bundle slugs
              if (accReleaseIds.includes(releaseId)) return accReleaseIds

              return [...accReleaseIds, releaseId]
            }
            return accReleaseIds
          }, [])

          if (mutatedReleaseIds.length) {
            return aggregatorFetch$(mutatedReleaseIds)
          }

          return EMPTY
        }),
      )
  }

  return (releaseIds: string[]) =>
    merge(aggregatorFetch$(releaseIds, true), aggregatorListener$(releaseIds))
}
