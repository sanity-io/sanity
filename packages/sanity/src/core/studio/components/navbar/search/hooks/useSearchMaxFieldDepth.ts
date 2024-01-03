import {catchError, map, shareReplay, startWith} from 'rxjs/operators'
import {Observable, of} from 'rxjs'
import {SanityClient} from '@sanity/client'
import {useMemoObservable} from 'react-rx'
import {isFinite} from 'lodash'
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
function fetchMaxDepth({client}: {client: SanityClient}): Observable<PartialIndexSettings> {
  const {projectId, dataset} = client.config()
  return client.observable.request<PartialIndexSettings>({
    uri: `/projects/${projectId}/datasets/${dataset}/index-settings`,
    tag: 'search.getPartialIndexSettings',
  })
}

const cachedSettings: Map<string, Observable<PartialIndexSettings>> = new Map()

/** @internal */
export function useSearchMaxFieldDepth(overrideClient?: SanityClient): number {
  const isEnabled = useWorkspace().search?.unstable_partialIndexing?.enabled
  const workspaceClient = useClient(DEFAULT_STUDIO_CLIENT_OPTIONS)
  const client = useMemo(() => overrideClient || workspaceClient, [overrideClient, workspaceClient])
  const dataset = useMemo(() => client.config().dataset, [client])!

  if (!isEnabled) {
    cachedSettings.set(dataset, of(INITIAL_LOADING_STATE.settings))
  }

  if (!cachedSettings.has(dataset)) {
    cachedSettings.set(dataset, fetchMaxDepth({client}).pipe(shareReplay()))
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

  const maxFieldDepth = indexSettings?.settings?.partialIndexSettings?.maxFieldDepth

  if (!isFinite(maxFieldDepth)) {
    return DEFAULT_MAX_FIELD_DEPTH
  }

  return Math.min(maxFieldDepth, DEFAULT_MAX_FIELD_DEPTH)
}
