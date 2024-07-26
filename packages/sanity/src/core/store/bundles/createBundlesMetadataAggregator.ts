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

const getFetchQuery = (bundleSlugs: string[]) => {
  // projection key must be string - cover the case that a bundle has a number as first char
  const getSafeSlug = (slug: string) => `bundle_${slug.replaceAll('-', '_')}`

  return bundleSlugs.reduce(
    ({subquery: accSubquery, projection: accProjection}, bundleSlug) => {
      const safeSlug = getSafeSlug(bundleSlug)

      const subquery = `${accSubquery}"${safeSlug}": *[_id in path("${bundleSlug}.*")]{_updatedAt } | order(_updatedAt desc),`

      // conforms to BundlesMetadata
      const projection = `${accProjection}"${bundleSlug}": {
              "updatedAt": ${safeSlug}[0]._updatedAt,
              "documentCount": count(${safeSlug})
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
    bundleSlugs: string[],
    isInitialLoad: boolean = false,
  ): Observable<MetadataWrapper> => {
    if (!bundleSlugs?.length || !client) return of({data: {}, error: null, loading: false})

    const {subquery: queryAllDocumentsInBundleSlugs, projection: projectionToBundleMetadata} =
      getFetchQuery(bundleSlugs)

    const fetchData$ = client.observable
      .fetch<BundlesMetadataMap>(
        `{${queryAllDocumentsInBundleSlugs}}{${projectionToBundleMetadata}}`,
      )
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

  const aggregatorListener$ = (bundleSlugs: string[]) => {
    if (!bundleSlugs?.length || !client) return EMPTY

    return client.observable
      .listen(
        `*[defined(_version) && (${bundleSlugs.reduce(
          (accQuery, bundleSlug, index) =>
            `${accQuery}${index === 0 ? '' : '||'} _id in path("${bundleSlug}.*")`,
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
          const mutatedBundleSlugs = entriesArray.reduce<string[]>((accBundleSlugs, event) => {
            if ('type' in event && event.type === 'mutation') {
              const bundleSlug = event.documentId.split('.')[0]
              // de-dup mutated bundle slugs
              if (accBundleSlugs.includes(bundleSlug)) return accBundleSlugs

              return [...accBundleSlugs, bundleSlug]
            }
            return accBundleSlugs
          }, [])

          if (mutatedBundleSlugs.length) {
            return aggregatorFetch$(mutatedBundleSlugs)
          }

          return EMPTY
        }),
      )
  }

  return (bundleSlugs: string[]) =>
    merge(aggregatorFetch$(bundleSlugs, true), aggregatorListener$(bundleSlugs))
}
