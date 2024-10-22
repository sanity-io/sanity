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
import {type SanityClient} from 'sanity'

import {type ReleasesMetadata} from './useReleasesMetadata'

export type ReleasesMetadataMap = Record<string, ReleasesMetadata>

export type MetadataWrapper = {data: ReleasesMetadataMap | null; error: null; loading: boolean}

const getFetchQuery = (releaseIds: string[]) => {
  // projection key must be string - cover the case that a bundle has a number as first char
  const getSafeKey = (id: string) => `release_${id.replaceAll('-', '_')}`

  return releaseIds.reduce(
    ({subquery: accSubquery, projection: accProjection}, releaseId) => {
      // get a version of the id that is safe to use as key in objects
      const safeId = getSafeKey(releaseId)

      const subquery = `${accSubquery}"${safeId}": *[_id in path("versions.${releaseId}.*")]{_updatedAt, "docId": string::split(_id, ".")[2] } | order(_updatedAt desc),`
      // "${safeId}_existingCount": count(*[_id in *[_id in path("versions.${releaseId}.*")]{"publishedVersionId": string::split(_id, ".")[2] }[].publishedVersionId]),`

      // conforms to ReleasesMetadata
      const projection = `${accProjection}"${releaseId}": {
              "updatedAt": ${safeId}[0]._updatedAt,
              "documentIds": ${safeId}[].docId,
              "documentCount": count(${safeId}),
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
 * @returns an Observable that accepts a list of bundle slugs and returns a stream of metadata
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
      .fetch<ReleasesMetadataMap>(`{${queryAllDocumentsInReleases}}{${projectionToBundleMetadata}}`)
      .pipe(
        switchMap((firstResp) => {
          const nextQuery = Object.entries(firstResp).reduce((agg, cur) => {
            if (cur[1].documentIds.length === 0) return agg

            return `${agg}"${cur[0]}_existing_count": count(*[_id in [${cur[1].documentIds.map((el) => `"${el}"`).toString()}]]{_id}),`
          }, ``)
          return client.observable.fetch(`{${nextQuery}}`).pipe(
            switchMap((secondResp) =>
              of({
                data: Object.entries(firstResp).reduce((acc, el) => {
                  return {
                    ...acc,
                    [el[0]]: {
                      ...el[1],
                      existingDocumentCount: secondResp[`${el[0]}_existing_count`] || 0,
                    },
                  }
                }, {}),
                error: null,
                loading: false,
              }),
            ),
          )
        }),
        catchError((error) => {
          console.error('Failed to fetch bundle metadata', error)
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
            `${accQuery}${index === 0 ? '' : ' ||'} _id in path("versions.${releaseId}.*")`,
          '',
        )})]`,
        {},
        {includeResult: true, visibility: 'query', events: ['mutation'], tag: 'bundle-docs.listen'},
      )
      .pipe(
        catchError((error) => {
          console.error('Failed to listen for bundle metadata', error)
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
