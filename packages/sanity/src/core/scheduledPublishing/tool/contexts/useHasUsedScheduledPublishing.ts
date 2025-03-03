import {type SanityClient} from '@sanity/client'
import {useMemo} from 'react'
import {useObservable} from 'react-rx'
import {catchError, map, type Observable, of, shareReplay} from 'rxjs'

import {useClient} from '../../../hooks/useClient'
import {useWorkspace} from '../../../studio/workspace'
import {DEFAULT_STUDIO_CLIENT_OPTIONS} from '../../../studioClient'
import {type Schedule} from '../../types'

export interface HasUsedScheduledPublishing {
  used: boolean
  loading: boolean
}

const HAS_USED_SCHEDULED_PUBLISHING: HasUsedScheduledPublishing = {used: false, loading: true}

export const cachedUsedScheduledPublishing = new Map<
  string,
  Observable<HasUsedScheduledPublishing>
>()

function fetchUsedScheduledPublishing(
  client: SanityClient,
): Observable<HasUsedScheduledPublishing> {
  const {dataset, projectId} = client.config()
  return client.observable
    .request<{
      schedules: Schedule[]
    }>({uri: `/schedules/${projectId}/${dataset}?limit=1`, tag: 'scheduled-publishing-used'})
    .pipe(
      map((res) => {
        return {used: res.schedules?.length > 0, loading: false}
      }),
      catchError(() => of({used: false, loading: false})),
    )
}

export function useHasUsedScheduledPublishing({
  explicitEnabled,
  isWorkspaceEnabled,
}: {
  explicitEnabled?: boolean
  isWorkspaceEnabled?: boolean
}) {
  const client = useClient(DEFAULT_STUDIO_CLIENT_OPTIONS)
  const {projectId, dataset} = useWorkspace()
  const key = `${projectId}-${dataset}`
  if (!cachedUsedScheduledPublishing.get(key)) {
    const hasUsed = fetchUsedScheduledPublishing(client).pipe(shareReplay())
    cachedUsedScheduledPublishing.set(key, hasUsed)
  }
  const hasUsedScheduledPublishing$ = useMemo(() => {
    // If the feature is explicitly enabled, we don't need to check if it has been used
    if (explicitEnabled) {
      return of({used: true, loading: false})
    }
    // If the workspace has turned off the feature is explicitly enabled, we don't need to check if it has been used
    if (!isWorkspaceEnabled) {
      return of({used: false, loading: false})
    }

    return cachedUsedScheduledPublishing.get(key) || of(HAS_USED_SCHEDULED_PUBLISHING)
  }, [key, explicitEnabled, isWorkspaceEnabled])

  return useObservable(hasUsedScheduledPublishing$, HAS_USED_SCHEDULED_PUBLISHING)
}
