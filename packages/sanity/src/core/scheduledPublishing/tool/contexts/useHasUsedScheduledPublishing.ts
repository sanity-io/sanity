import {type SanityClient} from '@sanity/client'
import {useMemo} from 'react'
import {preloadObservablePromise} from 'react-rx'
import {catchError, map, type Observable, of, shareReplay, tap, timeout} from 'rxjs'

import {useClient} from '../../../hooks/useClient'
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

/**
 * Whether the dataset has ever scheduled anything, cached per project and dataset: one probe for
 * the session. A failed probe is not kept, so whoever asks next retries (consumers that already
 * hold the failed observable read it as not used, see `useHasUsedScheduledPublishingObservable`).
 */
function getUsedScheduledPublishing(client: SanityClient): Observable<HasUsedScheduledPublishing> {
  const {dataset, projectId} = client.config()
  const key = `${projectId}-${dataset}`
  let hasUsed = cachedUsedScheduledPublishing.get(key)
  if (!hasUsed) {
    const request: Observable<HasUsedScheduledPublishing> = client.observable
      .request({
        url: `/schedules/${projectId}/${dataset}?limit=1`,
        tag: 'scheduled-publishing-used',
      })
      .pipe(
        timeout({first: PROBE_TIMEOUT}),
        map((res) => (res.schedules?.length > 0 ? USED : NOT_USED)),
        tap({
          error: () => {
            if (cachedUsedScheduledPublishing.get(key) === request) {
              cachedUsedScheduledPublishing.delete(key)
            }
          },
        }),
        shareReplay(),
      )
    hasUsed = request
    cachedUsedScheduledPublishing.set(key, hasUsed)
  }
  return hasUsed
}

/**
 * Starts the usage probe with `client` (any API version) if none is cached for its project and
 * dataset yet, so that it runs concurrently with the auth probe instead of after the auth state
 * has settled: the studio calls this with the client the auth store is about to probe, for
 * workspaces that load the plugin without enabling the feature explicitly. A prefetch made with
 * credentials that the probe then rejects fails and is evicted, so the plugin retries with its
 * own client after a login.
 *
 * @internal
 */
export function prefetchUsedScheduledPublishing(client: SanityClient): void {
  void preloadObservablePromise(
    getUsedScheduledPublishing(client.withConfig(DEFAULT_STUDIO_CLIENT_OPTIONS)),
  )
}

/**
 * Whether scheduled publishing counts as "used" for this workspace, as an observable of the
 * settled answer. Never errors: a failed probe reads as not used. Only called from the scheduled
 * publishing plugin, which `getDefaultPlugins` includes only when the workspace has the feature
 * enabled.
 */
export function useHasUsedScheduledPublishingObservable({
  explicitEnabled,
}: {
  explicitEnabled?: boolean
}): Observable<HasUsedScheduledPublishing> {
  const client = useClient(DEFAULT_STUDIO_CLIENT_OPTIONS)
  return useMemo(() => {
    // If the feature is explicitly enabled, we don't need to check if it has been used
    if (explicitEnabled) {
      return of(USED)
    }
    return getUsedScheduledPublishing(client).pipe(catchError(() => of(NOT_USED)))
  }, [client, explicitEnabled])
}
