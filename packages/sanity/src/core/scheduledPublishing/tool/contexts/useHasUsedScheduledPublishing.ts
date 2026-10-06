import {type SanityClient} from '@sanity/client'
import {useMemo} from 'react'
import {catchError, map, type Observable, of, shareReplay, timeout} from 'rxjs'

import {useClient} from '../../../hooks/useClient'
import {useWorkspace} from '../../../studio/workspace'
import {DEFAULT_STUDIO_CLIENT_OPTIONS} from '../../../studioClient'

export interface HasUsedScheduledPublishing {
  used: boolean
}

const USED: HasUsedScheduledPublishing = {used: true}
const NOT_USED: HasUsedScheduledPublishing = {used: false}

/** A probe that has not answered after this long counts as failed, and so as not used */
const PROBE_TIMEOUT = 10_000

export const cachedUsedScheduledPublishing = new Map<
  string,
  Observable<HasUsedScheduledPublishing>
>()

function fetchUsedScheduledPublishing(
  client: SanityClient,
): Observable<HasUsedScheduledPublishing> {
  const {dataset, projectId} = client.config()
  return client.observable
    .request({url: `/schedules/${projectId}/${dataset}?limit=1`, tag: 'scheduled-publishing-used'})
    .pipe(
      timeout({first: PROBE_TIMEOUT}),
      map((res) => (res.schedules?.length > 0 ? USED : NOT_USED)),
      catchError(() => of(NOT_USED)),
    )
}

/**
 * Whether scheduled publishing counts as "used" for this workspace, as an observable of the
 * settled answer. Only called from the scheduled publishing plugin, which `getDefaultPlugins`
 * includes only when the workspace has the feature enabled.
 */
export function useHasUsedScheduledPublishingObservable({
  explicitEnabled,
}: {
  explicitEnabled?: boolean
}): Observable<HasUsedScheduledPublishing> {
  const client = useClient(DEFAULT_STUDIO_CLIENT_OPTIONS)
  const {projectId, dataset} = useWorkspace()
  const key = `${projectId}-${dataset}`
  return useMemo(() => {
    // If the feature is explicitly enabled, we don't need to check if it has been used
    if (explicitEnabled) {
      return of(USED)
    }

    let hasUsed = cachedUsedScheduledPublishing.get(key)
    if (!hasUsed) {
      hasUsed = fetchUsedScheduledPublishing(client).pipe(shareReplay())
      cachedUsedScheduledPublishing.set(key, hasUsed)
    }
    return hasUsed
  }, [client, key, explicitEnabled])
}
