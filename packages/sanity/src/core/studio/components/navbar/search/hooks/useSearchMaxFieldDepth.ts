import {type SanityClient} from '@sanity/client'
import {DEFAULT_MAX_FIELD_DEPTH} from '@sanity/schema/_internal'
import isFinite from 'lodash-es/isFinite.js'
import {useMemo} from 'react'
import {useObservable} from 'react-rx'
import {type Observable, of} from 'rxjs'
import {catchError, map, shareReplay, startWith} from 'rxjs/operators'

import {useClient} from '../../../../../hooks/useClient'
import {type PartialIndexFieldPaths} from '../../../../../search/common/types'
import {DEFAULT_STUDIO_CLIENT_OPTIONS} from '../../../../../studioClient'
import {useWorkspace} from '../../../../workspace'

/** By default the API will return 0 = all fields */
const DEFAULT_API_FIELD_DEPTH = 0

/**
 * @internal
 * @hidden
 */
export interface PartialIndexSettings {
  partialIndexSettings: {
    maxFieldDepth: number
    excludeFieldPaths?: string[]
    includeFieldPaths?: string[]
  }
}

/**
 * The parts of the dataset's partial index settings that Studio search applies.
 *
 * @internal
 * @hidden
 */
export interface SearchPartialIndexSettings {
  /**
   * `true` while the dataset's index settings are being fetched. Until then `maxFieldDepth` is the
   * default and `fieldPaths` is `undefined`, so search should wait rather than send a query that
   * the index may reject.
   */
  isLoading: boolean
  maxFieldDepth: number
  /**
   * `undefined` when partial indexing is disabled for the workspace, or the dataset excludes no
   * field paths.
   */
  fieldPaths: PartialIndexFieldPaths | undefined
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
function fetchIndexSettings({client}: {client: SanityClient}): Observable<PartialIndexSettings> {
  const {projectId, dataset} = client.config()
  return client.observable.request<PartialIndexSettings>({
    url: `/projects/${projectId}/datasets/${dataset}/settings/indexing`,
    tag: 'search.getPartialIndexSettings',
  })
}

const cachedSettings: Map<string, Observable<PartialIndexSettings>> = new Map()

function toFieldPaths(
  settings: PartialIndexSettings['partialIndexSettings'] | undefined,
): PartialIndexFieldPaths | undefined {
  const excludeFieldPaths = settings?.excludeFieldPaths
  if (!Array.isArray(excludeFieldPaths) || excludeFieldPaths.length === 0) {
    return undefined
  }
  return {
    excludeFieldPaths,
    includeFieldPaths: Array.isArray(settings?.includeFieldPaths) ? settings.includeFieldPaths : [],
  }
}

/**
 * Resolves the maximum field depth to search when `search.unstable_partialIndexing` is enabled.
 *
 * @deprecated Pass `fieldPaths: true` to also get the field paths excluded from the dataset's
 * partial index, which search must not boost: `useSearchMaxFieldDepth(client, true)`.
 * @internal
 * @hidden
 */
export function useSearchMaxFieldDepth(overrideClient?: SanityClient): number
/**
 * Resolves the dataset's partial index settings when `search.unstable_partialIndexing` is enabled:
 * the maximum field depth to search, and the field paths excluded from the index, which search
 * must not boost.
 *
 * @internal
 * @hidden
 */
export function useSearchMaxFieldDepth(
  overrideClient: SanityClient | undefined,
  fieldPaths: true,
): SearchPartialIndexSettings
export function useSearchMaxFieldDepth(
  overrideClient?: SanityClient,
  withFieldPaths?: true,
): number | SearchPartialIndexSettings {
  const isEnabled = useWorkspace().search?.unstable_partialIndexing?.enabled
  const workspaceClient = useClient(DEFAULT_STUDIO_CLIENT_OPTIONS)
  const client = useMemo(() => overrideClient || workspaceClient, [overrideClient, workspaceClient])
  const dataset = useMemo(() => client.config().dataset, [client])!

  if (!isEnabled) {
    cachedSettings.set(dataset, of(INITIAL_LOADING_STATE.settings))
  }

  if (!cachedSettings.has(dataset)) {
    cachedSettings.set(dataset, fetchIndexSettings({client}).pipe(shareReplay()))
  }

  const indexSettingsObservable = useMemo(
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
  )
  const indexSettings = useObservable(indexSettingsObservable, INITIAL_LOADING_STATE)
  const partialIndexSettings = indexSettings?.settings?.partialIndexSettings

  const apiMaxFieldDepth = partialIndexSettings?.maxFieldDepth
  const maxFieldDepth = isFinite(apiMaxFieldDepth)
    ? Math.min(apiMaxFieldDepth, DEFAULT_MAX_FIELD_DEPTH)
    : DEFAULT_MAX_FIELD_DEPTH

  const fieldPaths = useMemo(() => toFieldPaths(partialIndexSettings), [partialIndexSettings])

  const isLoading = Boolean(isEnabled) && indexSettings.isLoading

  const settings = useMemo(
    () => ({isLoading, maxFieldDepth, fieldPaths}),
    [isLoading, maxFieldDepth, fieldPaths],
  )

  return withFieldPaths ? settings : maxFieldDepth
}
