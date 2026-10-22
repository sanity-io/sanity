import {type SanityClient} from '@sanity/client'
import {useMemo} from 'react'
import {useObservable} from 'react-rx'
import {type Observable, of} from 'rxjs'
import {catchError, map, shareReplay, startWith, tap} from 'rxjs/operators'

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
 * PROPOSED (Studio-wide): the features last received per project. react-rx renders a hook's initial value on mount before a cached
 * observable replays, so every remount of a document pane (it is keyed by document) showed "loading" for a pass, and what is gated on a
 * feature (the Comments button in the pane header) disappeared and came back on each document switch. A known list is the initial value.
 */
const knownFeatures = new Map<string, string[]>()

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
    features = fetchFeatures({versionedClient}).pipe(
      tap((list) => knownFeatures.set(projectId, list ?? EMPTY_ARRAY)),
      shareReplay(),
    )
    cachedFeatureRequest.set(projectId, features)
  }
  return features
}

/** @internal */
export function useFeatureEnabled(featureKey: keyof typeof FEATURES): Features {
  const versionedClient = useClient(DEFAULT_STUDIO_CLIENT_OPTIONS)
  // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
  const {projectId} = useSource()

  const req = getFeatures({projectId, versionedClient})
  const known = knownFeatures.get(projectId)
  const initialState = useMemo(
    (): Features =>
      known
        ? {isLoading: false, enabled: known.includes(featureKey), features: known, error: null}
        : INITIAL_LOADING_STATE,
    [featureKey, known],
  )

  const featureInfoObservable = useMemo(
    () =>
      req.pipe(
        map((features = []) => ({
          isLoading: false,
          enabled: Boolean(features?.includes(featureKey)),
          features,
          error: null,
        })),
        startWith(initialState),
        catchError((error: Error) => {
          return of({isLoading: false, enabled: false, features: EMPTY_ARRAY, error})
        }),
      ),
    [featureKey, req, initialState],
  )
  const featureInfo = useObservable(featureInfoObservable, initialState)

  return featureInfo
}
