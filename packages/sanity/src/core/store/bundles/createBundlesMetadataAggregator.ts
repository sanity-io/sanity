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

import {type BundlesMetadata} from '../../releases/tool/useBundlesMetadata'

export type BundlesMetadataMap = Record<string, BundlesMetadata>

export type MetadataWrapper = {data: BundlesMetadataMap | null; error: null; loading: boolean}

const getFetchQuery = (bundleIds: string[]) => {
  // projection key must be string - cover the case that a bundle has a number as first char
  const getSafeKey = (id: string) => `bundle_${id.replaceAll('-', '_')}`

  return bundleIds.reduce(
    ({subquery: accSubquery, projection: accProjection}, bundleId) => {
      // get a version of the id that is safe to use as key in objects
      const safeId = getSafeKey(bundleId)

      const subquery = `${accSubquery}"${safeId}": *[_id in path("versions.${bundleId}.*")]{_updatedAt } | order(_updatedAt desc),`

      // conforms to BundlesMetadata
      const projection = `${accProjection}"${bundleId}": {
              "updatedAt": ${safeId}[0]._updatedAt,
              "documentCount": count(${safeId})
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
 * Only bundles that have been mutated are re-fetched
 *
 * @returns an Observable that accepts a list of bundle slugs and returns a stream of metadata
 */
export const createBundlesMetadataAggregator = (client: SanityClient | null) => {
  const aggregatorFetch$ = (
    bundleIds: string[],
    isInitialLoad: boolean = false,
  ): Observable<MetadataWrapper> => {
    if (!bundleIds?.length || !client) return of({data: null, error: null, loading: false})

    const {subquery: queryAllDocumentsInBundles, projection: projectionToBundleMetadata} =
      getFetchQuery(bundleIds)

    const fetchData$ = client.observable
      .fetch<BundlesMetadataMap>(`{${queryAllDocumentsInBundles}}{${projectionToBundleMetadata}}`)
      .pipe(
        switchMap((response) => of({data: response, error: null, loading: false})),
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

  const aggregatorListener$ = (bundleIds: string[]) => {
    if (!bundleIds?.length || !client) return EMPTY

    return client.observable
      .listen(
        `(${bundleIds.reduce(
          (accQuery, bundleId, index) =>
            `${accQuery}${index === 0 ? '' : '||'} _id in path("versions.${bundleId}.*")`,
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
          const mutatedBundleIds = entriesArray.reduce<string[]>((accBundleIds, event) => {
            if ('type' in event && event.type === 'mutation') {
              const bundleId = event.documentId.split('.')[0]
              // de-dup mutated bundle slugs
              if (accBundleIds.includes(bundleId)) return accBundleIds

              return [...accBundleIds, bundleId]
            }
            return accBundleIds
          }, [])

          if (mutatedBundleIds.length) {
            return aggregatorFetch$(mutatedBundleIds)
          }

          return EMPTY
        }),
      )
  }

  return (bundleIds: string[]) =>
    merge(aggregatorFetch$(bundleIds, true), aggregatorListener$(bundleIds))
}
