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
import {createMemoKey, getClientCredentialSegments} from '../document/utils/memoKey'
import {type ProjectData, type ProjectGrants, type ProjectStore} from './types'

const REFETCH_INTERVAL = 5 * 60 * 1000 // 5 minutes

// Memo key for the per-client request observables below. Must include the
// credential, not just project/dataset — these poll `/projects` on a captured
// client, so a stale-token entry would keep 401ing after a re-login (see
// getClientCredentialSegments). The old entry goes idle when its last
// subscriber leaves, but the memoizer never evicts, so its key and token string
// are retained for the life of the page. Token stays in-memory (never logged).
function projectRequestKey(client: SanityClient): string {
  return createMemoKey(getClientCredentialSegments(client))
}

/**
 * This value will be cached for 5 minutes, after that internal the cache will be refreshed.
 * If you need to be 100% sure the organizationId is up to date, you can call the `/projects/${projectId}` endpoint directly.
 */
const getProjectOrg = memoize((client: SanityClient) => {
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
}, projectRequestKey)

const getOrganizationId = memoize(
  (client: SanityClient) => getProjectOrg(client).pipe(map((res) => res?.organizationId ?? null)),
  projectRequestKey,
)

const getOrganizationData = memoize(
  (client: SanityClient) => getProjectOrg(client).pipe(map((res) => res?.organization ?? null)),
  projectRequestKey,
)

/**
 * Fetches the project grants for the current user, shared and replayed so all
 * permission checks reuse a single request. Memoized so callers outside the
 * project store (e.g. the schema/manifest upload gate) hit the same cached
 * observable instead of issuing a duplicate `/grants` request.
 *
 * Keyed by project/dataset **and credential** (see `projectRequestKey`),
 * matching the other memoized requests in this module, so a client for a
 * different project/dataset — or a new post-re-auth token — never reuses
 * another's grants.
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
  projectRequestKey,
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
    getProjectName: () => projectOrgData$.pipe(map((res) => res?.displayName ?? null)),
    getOrganizationData: () => projectOrgData$.pipe(map((res) => res?.organization ?? null)),
    getOrganizationId: () => projectOrgData$.pipe(map((res) => res?.organizationId ?? null)),
  }
}
