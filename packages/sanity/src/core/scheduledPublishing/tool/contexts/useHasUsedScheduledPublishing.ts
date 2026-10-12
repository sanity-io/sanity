import {type SanityClient} from '@sanity/client'
import {useMemo} from 'react'
import {catchError, map, type Observable, of, shareReplay, timeout} from 'rxjs'

import {useClient} from '../../../hooks/useClient'
import {DEFAULT_STUDIO_CLIENT_OPTIONS} from '../../../studioClient'

/** A probe that has not answered after this long counts as failed, and so as not used */
const PROBE_TIMEOUT = 10_000

export const cachedUsedScheduledPublishing = new Map<string, Observable<boolean>>()

/**
 * Whether the dataset has ever scheduled anything, cached per project and dataset: one probe for
 * the session. A failed probe reads as not used.
 */
function getUsedScheduledPublishing(client: SanityClient): Observable<boolean> {
  const {dataset, projectId} = client.config()
  const key = `${projectId}-${dataset}`
  let hasUsed = cachedUsedScheduledPublishing.get(key)
  if (!hasUsed) {
    hasUsed = client.observable
      .request({
        url: `/schedules/${projectId}/${dataset}?limit=1`,
        tag: 'scheduled-publishing-used',
      })
      .pipe(
        timeout({first: PROBE_TIMEOUT}),
        map((res) => res.schedules?.length > 0),
        catchError(() => of(false)),
        shareReplay(),
      )
    cachedUsedScheduledPublishing.set(key, hasUsed)
  }
  return hasUsed
}

/**
 * Whether scheduled publishing counts as used for this workspace, as an observable of the
 * settled answer for `useObservablePromise` and `use()`. Never errors: a failed probe reads as
 * not used. A workspace that opted in explicitly counts as used without probing.
 */
export function useHasUsedScheduledPublishingObservable({
  explicitEnabled,
}: {
  explicitEnabled?: boolean
}): Observable<boolean> {
  const client = useClient(DEFAULT_STUDIO_CLIENT_OPTIONS)
  return useMemo(() => {
    if (explicitEnabled) {
      return of(true)
    }
    return getUsedScheduledPublishing(client)
  }, [client, explicitEnabled])
}
