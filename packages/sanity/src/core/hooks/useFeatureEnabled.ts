import {type SanityClient} from '@sanity/client'
import {useMemo} from 'react'
import {type ObservablePromise, useObservable, useObservablePromise} from 'react-rx'
import {type Observable, of} from 'rxjs'
import {catchError, map, shareReplay, startWith} from 'rxjs/operators'

import {useSource} from '../studio/source'
import {DEFAULT_STUDIO_CLIENT_OPTIONS} from '../studioClient'
import {useClient} from './useClient'

const EMPTY_ARRAY: [] = []

interface Features {
  enabled: boolean
  error: Error | null
  features: string[]
  isLoading: boolean
}

/**
 * A feature check that has settled: the feature list has loaded, or failed to and `error` says
 * why. What {@link useFeatureEnabledPromise} resolves to.
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
 * The settled answer for one feature key, over the project's cached feature request. A failed
 * request settles as `enabled: false` with `error` set rather than erroring the stream.
 */
function useFeatureEnabledObservable(
  featureKey: keyof typeof FEATURES,
): Observable<SettledFeatures> {
  const versionedClient = useClient(DEFAULT_STUDIO_CLIENT_OPTIONS)
  // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
  const {projectId} = useSource()

  const req = getFeatures({projectId, versionedClient})

  return useMemo(
    () =>
      req.pipe(
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

/**
 * The same check as {@link useFeatureEnabled}, as a promise for React's `use()`: read it in a
 * child under a `<Suspense>` boundary and that child renders once, with the settled answer,
 * instead of once for the loading state and again for the answer. That matters wherever the
 * answer decides the shape of the tree (which providers wrap the layout, which navbar buttons
 * and tools exist): a late answer there means a remount of everything below, or a layout shift.
 *
 * Call this above the boundary, not in the component that calls `use()`: the request starts
 * when this hook's caller commits, and a component that suspends never commits. A
 * `studio.components.providers` component is the natural place: it renders above the studio's
 * loading screen boundary, so a layout, navbar or tool below can `use()` the promise from a
 * context and suspend up to that screen. The promise never rejects; a failed request settles as
 * `enabled: false` with `error` set.
 *
 * @internal
 */
export function useFeatureEnabledPromise(
  featureKey: keyof typeof FEATURES,
): ObservablePromise<SettledFeatures> {
  return useObservablePromise(useFeatureEnabledObservable(featureKey))
}
