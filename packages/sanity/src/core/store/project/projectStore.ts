import {type SanityClient} from '@sanity/client'
import {
  catchError,
  distinctUntilChanged,
  map,
  type Observable,
  of,
  repeat,
  ReplaySubject,
  scan,
  share,
  shareReplay,
  timer,
} from 'rxjs'

import {memoize} from '../document/utils/createMemoizer'
import {type ProjectData, type ProjectGrants, type ProjectStore} from './types'

const REFETCH_INTERVAL = 5 * 60 * 1000 // 5 minutes

/**
 * This value will be cached for 5 minutes, after that internal the cache will be refreshed.
 * If you need to be 100% sure the organizationId is up to date, you can call the `/projects/${projectId}` endpoint directly.
 */
const getProjectOrg = memoize(
  (client: SanityClient) => {
    return client.observable
      .request<ProjectData>({
        url: `/projects/${client.config().projectId}`,
        tag: 'get-project-org',
        query: {
          includeMembers: 'false',
          includeFeatures: 'false',
          includeOrganization: 'true',
        },
      })
      .pipe(
        catchError(() => {
          return of(null)
        }),
        repeat({delay: REFETCH_INTERVAL}),
        // A transient refetch failure emits `null`. Retain the last known
        // project data so a failed refetch does not clobber a previously-good
        // organization id (which would strip org_id from telemetry events
        // flushed during the refetch window). See SAPP-3824.
        scan<ProjectData | null, ProjectData | null>((lastKnown, next) => next ?? lastKnown, null),
        distinctUntilChanged(),
        share({
          connector: () => new ReplaySubject(1),
          resetOnComplete: true,
          // delay unsubscriptions a little to keep the observable active
          // during React effect setup and teardown due to rapidly changing deps
          resetOnRefCountZero: () => timer(1000),
        }),
      )
  },
  (client) => `${client.config().projectId}-${client.config().dataset}`,
)

const getOrganizationId = memoize(
  (client: SanityClient) => getProjectOrg(client).pipe(map((res) => res?.organizationId ?? null)),
  (client) => `${client.config().projectId}-${client.config().dataset}`,
)

const getOrganizationData = memoize(
  (client: SanityClient) => getProjectOrg(client).pipe(map((res) => res?.organization ?? null)),
  (client) => `${client.config().projectId}-${client.config().dataset}`,
)

/**
 * Fetches the project grants for the current user, shared and replayed so all
 * permission checks reuse a single request. Memoized so callers outside the
 * project store (e.g. the schema/manifest upload gate) hit the same cached
 * observable instead of issuing a duplicate `/grants` request.
 *
 * Keyed by `projectId-dataset`, matching the other memoized requests in this
 * module, so a client for a different project/dataset never reuses another's
 * grants.
 *
 * @internal
 */
export const getProjectGrants = memoize(
  (client: SanityClient): Observable<ProjectGrants> =>
    client.observable
      .request<ProjectGrants>({
        url: `/projects/${client.config().projectId}/grants`,
        tag: 'get-grants',
      })
      .pipe(shareReplay(1)),
  (client) => `${client.config().projectId}-${client.config().dataset}`,
)

/** @internal */
export function createProjectStore(context: {client: SanityClient}): ProjectStore {
  const {client} = context
  const projectId = client.config().projectId
  const versionedClient = client.withConfig({apiVersion: '2021-12-15'})

  function get(): Observable<ProjectData> {
    return versionedClient.observable.request({
      url: `/projects/${projectId}`,
      tag: 'get-project',
    })
  }

  function getDatasets() {
    return versionedClient.observable.request({
      url: `/projects/${projectId}/datasets`,
      tag: 'get-datasets',
    })
  }

  const projectOrgData$ = getProjectOrg(versionedClient)

  return {
    get,
    getDatasets,
    getGrants: () => getProjectGrants(versionedClient),
    getOrganizationData: () => projectOrgData$.pipe(map((res) => res?.organization ?? null)),
    getOrganizationId: () => projectOrgData$.pipe(map((res) => res?.organizationId ?? null)),
  }
}
