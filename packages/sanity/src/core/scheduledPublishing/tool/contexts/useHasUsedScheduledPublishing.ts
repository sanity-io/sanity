import {type SanityClient} from '@sanity/client'
import {useMemo} from 'react'
import {type ObservablePromise, useObservablePromise} from 'react-rx'
import {catchError, map, type Observable, of, shareReplay} from 'rxjs'

import {useClient} from '../../../hooks/useClient'
import {useWorkspace} from '../../../studio/workspace'
import {DEFAULT_STUDIO_CLIENT_OPTIONS} from '../../../studioClient'

export interface HasUsedScheduledPublishing {
  used: boolean
}

const USED: HasUsedScheduledPublishing = {used: true}
const NOT_USED: HasUsedScheduledPublishing = {used: false}

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
      map((res) => (res.schedules?.length > 0 ? USED : NOT_USED)),
      catchError(() => of(NOT_USED)),
    )
}

/**
 * Whether scheduled publishing counts as "used" for this workspace, as a promise for `use()`.
 * The answer decides whether the Schedules tool exists in the navbar and which providers wrap the
 * layout, so `ScheduledPublishingEnabledProvider` suspends on it rather than flipping the layout
 * when the probe returns. Call this in the parent above that Suspense boundary.
 */
export function useHasUsedScheduledPublishingPromise({
  explicitEnabled,
  isWorkspaceEnabled,
}: {
  explicitEnabled?: boolean
  isWorkspaceEnabled?: boolean
}): ObservablePromise<HasUsedScheduledPublishing> {
  const client = useClient(DEFAULT_STUDIO_CLIENT_OPTIONS)
  const {projectId, dataset} = useWorkspace()
  const key = `${projectId}-${dataset}`
  const hasUsedScheduledPublishing$ = useMemo(() => {
    // If the feature is explicitly enabled, we don't need to check if it has been used
    if (explicitEnabled) {
      return of(USED)
    }
    // If the workspace has turned off the feature, we don't need to check if it has been used
    if (!isWorkspaceEnabled) {
      return of(NOT_USED)
    }

    let hasUsed = cachedUsedScheduledPublishing.get(key)
    if (!hasUsed) {
      hasUsed = fetchUsedScheduledPublishing(client).pipe(shareReplay())
      cachedUsedScheduledPublishing.set(key, hasUsed)
    }
    return hasUsed
  }, [client, key, explicitEnabled, isWorkspaceEnabled])

  return useObservablePromise(hasUsedScheduledPublishing$)
}
