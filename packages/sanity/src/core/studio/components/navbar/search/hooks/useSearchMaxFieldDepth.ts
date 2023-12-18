import {catchError, map, shareReplay, startWith} from 'rxjs/operators'
import {Observable, of} from 'rxjs'
import {SanityClient} from '@sanity/client'
import {useMemoObservable} from 'react-rx'
import {isNumber} from 'lodash'
import {DEFAULT_MAX_FIELD_DEPTH} from '@sanity/schema/_internal'
import {DEFAULT_STUDIO_CLIENT_OPTIONS} from '../../../../../studioClient'
import {useWorkspace} from '../../../../workspace'
import {useClient} from '../../../../../hooks'
import {useMemo} from 'react'

/** By default the API will return 0 = all fields */
const DEFAULT_API_FIELD_DEPTH = 0

export interface PartialIndexSettings {
  partialIndexSettings: {
    maxFieldDepth: number
  }
}

interface Settings {
  isLoading: boolean
  settings: PartialIndexSettings
}

const INITIAL_LOADING_STATE: Settings = {
  isLoading: true,
  settings: {
    partialIndexSettings: {
      maxFieldDepth: DEFAULT_API_FIELD_DEPTH,
    },
  },
}

/**
 * Fetches the index settings for the current dataset, if any
 */
function fetchMaxDepth({
  versionedClient,
}: {
  versionedClient: SanityClient
}): Observable<PartialIndexSettings> {
  const {projectId, dataset} = versionedClient.config()
  return versionedClient.observable.request<PartialIndexSettings>({
    uri: `/projects/${projectId}/datasets/${dataset}/index-settings`,
    tag: 'search.getPartialIndexSettings',
  })
}

const cachedSettings: Map<string, Observable<PartialIndexSettings>> = new Map()

/** @internal */
export function useSearchMaxFieldDepth(): number {
  const isEnabled = useWorkspace().search?.unstable_partialIndexing?.enabled
  const versionedClient = useClient(DEFAULT_STUDIO_CLIENT_OPTIONS)
  const dataset = useMemo(() => versionedClient.config().dataset, [versionedClient])!

  if (!isEnabled) {
    cachedSettings.set(dataset, of(INITIAL_LOADING_STATE.settings))
  }

  if (!cachedSettings.has(dataset)) {
    cachedSettings.set(dataset, fetchMaxDepth({versionedClient}).pipe(shareReplay()))
  }

  const indexSettings = useMemoObservable(
    () =>
      cachedSettings.get(dataset)!.pipe(
        map((settings) => ({
          isLoading: false,
          settings,
        })),
        startWith(INITIAL_LOADING_STATE),
        catchError((err: Error) => {
          console.error(err)
          return of({
            isLoading: false,
            enabled: true,
            settings: {partialIndexSettings: {maxFieldDepth: DEFAULT_API_FIELD_DEPTH}},
          })
        }),
      ),
    [dataset],
    INITIAL_LOADING_STATE,
  )

  /**
   * Studio currently uses zero indexed depths, while the partial index uses one indexed depths
   * 0 = all fields
   * 1 = only top level fields
   * 5 = all fields
   */
  const maxFieldDepth = (indexSettings?.settings?.partialIndexSettings?.maxFieldDepth ?? 1) - 1

  /**
   * If the maxFieldDepth is not a number or is -1 or 5, return the default value.
   */
  if (!isNumber(maxFieldDepth) || maxFieldDepth < 0) {
    return DEFAULT_MAX_FIELD_DEPTH
  }

  return Math.min(maxFieldDepth, DEFAULT_MAX_FIELD_DEPTH)
}
