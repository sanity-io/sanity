import {type SanityClient} from '@sanity/client'
import {useMemo} from 'react'
import {useObservable} from 'react-rx'
import {type Observable, of, throwError} from 'rxjs'
import {catchError, map, shareReplay, startWith, timeout} from 'rxjs/operators'

import {useSource} from '../studio/source'
import {DEFAULT_STUDIO_CLIENT_OPTIONS} from '../studioClient'
import {useClient} from './useClient'

const EMPTY_ARRAY: [] = []

/** A `/features` request that has not answered after this long counts as failed */
const FEATURES_TIMEOUT = 10_000

interface Features {
  enabled: boolean
  error: Error | null
  features: string[]
  isLoading: boolean
}

/**
 * A feature check that has settled: loaded, or failed with `error` set.
 * @internal
 */
export type SettledFeatures = Omit<Features, 'isLoading'>

const INITIAL_LOADING_STATE: Features = {
  enabled: true,
  error: null,
  features: EMPTY_ARRAY,
  isLoading: true,
}

export const FEATURES: Record<string, string> = {
  contentReleases: 'contentReleases',
  studioComments: 'studioComments',
  crossDatasetReferences: 'crossDatasetReferences',
  scheduledPublishing: 'scheduledPublishing',
  sanityTasks: 'sanityTasks',
  singleDocRelease: 'singleDocRelease',
}
/**
 * fetches all the enabled features for this project
 */
function fetchFeatures({versionedClient}: {versionedClient: SanityClient}): Observable<string[]> {
  return versionedClient.observable.request<string[]>({
    url: `/features`,
    tag: 'features',
  })
}

const cachedFeatureRequest = new Map<string, Observable<string[]>>()

/**
 * Retrieves the features for a given project. This returns a cached observable.
 * The client should be initialized with the options in `DEFAULT_STUDIO_CLIENT_OPTIONS`.
 */
function getFeatures({
  projectId,
  versionedClient,
}: {
  projectId: string
  versionedClient: SanityClient
}): Observable<string[]> {
  let features = cachedFeatureRequest.get(projectId)
  if (!features) {
    features = fetchFeatures({versionedClient}).pipe(shareReplay())
    cachedFeatureRequest.set(projectId, features)
  }
  return features
}

/**
 * The same check as {@link useFeatureEnabled}, as an observable of the settled answer for
 * `useObservablePromise` and `use()`, so a component that decides the shape of the tree can
 * suspend until the answer is in instead of rendering a loading state first. Never errors: a
 * failed request settles as `enabled: false` with `error` set. Stable identity per feature key.
 *
 * @internal
 */
export function useFeatureEnabledObservable(
  featureKey: keyof typeof FEATURES,
): Observable<SettledFeatures> {
  const versionedClient = useClient(DEFAULT_STUDIO_CLIENT_OPTIONS)
  // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
  const {projectId} = useSource()

  const req = getFeatures({projectId, versionedClient})

  return useMemo(
    () =>
      req.pipe(
        // The bound is per subscriber, outside the cached request: a late answer still lands in
        // the cache for the next reader instead of being replayed as a failure for the session
        timeout({
          first: FEATURES_TIMEOUT,
          with: () =>
            throwError(
              () =>
                new Error(
                  `Timed out after ${FEATURES_TIMEOUT / 1000}s waiting for the project's feature list (/features)`,
                ),
            ),
        }),
        map((features = []): SettledFeatures => ({
          enabled: Boolean(features?.includes(featureKey)),
          features,
          error: null,
        })),
        catchError((error: Error) =>
          of<SettledFeatures>({enabled: false, features: EMPTY_ARRAY, error}),
        ),
      ),
    [featureKey, req],
  )
}

/** @internal */
export function useFeatureEnabled(featureKey: keyof typeof FEATURES): Features {
  const settled$ = useFeatureEnabledObservable(featureKey)

  const featureInfoObservable = useMemo(
    () =>
      settled$.pipe(
        map((settled): Features => ({...settled, isLoading: false})),
        startWith(INITIAL_LOADING_STATE),
      ),
    [settled$],
  )

  return useObservable(featureInfoObservable, INITIAL_LOADING_STATE)
}
