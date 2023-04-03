import {useEffect, useMemo, useRef} from 'react'
import {BehaviorSubject, Subscription} from 'rxjs'
import {TimelineController, useHistoryStore} from '../../..'
import {useClient} from '../../../hooks'
import {DEFAULT_STUDIO_CLIENT_OPTIONS} from '../../../studioClient'
import {remoteSnapshots, RemoteSnapshotVersionEvent} from '../document'

interface UseTimelineControllerOpts {
  documentId: string
  documentType: string
  rev?: string
  since?: string
}

/**
 * Handles the creation of a document Timeline and TimelineController, returning an Observable that
 * can be subscribed to (containing the latest TimelineController state).
 *
 * Individual components can subscribe and opt-in to specific TimelineController updates to limit
 * unnecessary re-rendering.
 *
 * @internal
 * */
export function useTimelineController({
  documentId,
  documentType,
  rev,
  since,
}: UseTimelineControllerOpts): {
  timelineController$: BehaviorSubject<TimelineController>
} {
  const historyStore = useHistoryStore()
  const snapshotsSubscriptionRef = useRef<Subscription | null>(null)
  const client = useClient(DEFAULT_STUDIO_CLIENT_OPTIONS)

  /**
   * The mutable TimelineController, used internally
   */
  const controller = useMemo(
    () =>
      historyStore.getTimelineController({
        client,
        documentId,
        documentType,
      }),
    [client, documentId, documentType, historyStore]
  )

  /**
   * A BehaviorSubject which can be subscribed by multiple observers, which broadcasts
   * the the latest state of the (mutable) TimelineController.
   */
  const timelineController$ = useMemo(
    () => new BehaviorSubject<TimelineController>(controller),
    [controller]
  )

  /**
   * Broadcasts the updated state on TimelineController's `handler` updates (as well as on mount / unmount).
   *
   * Note that TimelineController triggers updates very frequently when fetching transactions, which it does so
   * in fairly small batches.
   *
   * This will also suspend TimelineController transaction fetching on cleanup, ensuring that fetches don't
   * continue once the document pane has been closed.
   */
  useEffect(() => {
    controller.setRange(since || null, rev || null)
    timelineController$.next(controller)

    controller.handler = (err, innerController) => {
      if (!err) {
        /**
         * NOTE: TimelineController requires that you call `setRange` manually whenever its internal
         * timeline has changed (e.g. has a result of fetched transactions).
         * Ideally, TimelineController would be updated to handle this automatically for us.
         * Until then, this workaround waits until the next call stack before calling `setRange`.
         */
        setTimeout(() => {
          innerController.setRange(since || null, rev || null)
          timelineController$.next(innerController)
        }, 0)
      }
    }
    controller.resume()
    return () => controller.suspend()
  }, [rev, since, controller, timelineController$])

  /**
   * Fetch document snapshots and update the mutable controller.
   *
   * Unsubscribes on clean up, preventing double fetches in strict mode.
   */
  useEffect(() => {
    if (!snapshotsSubscriptionRef.current) {
      snapshotsSubscriptionRef.current = remoteSnapshots(
        client,
        {draftId: `drafts.${documentId}`, publishedId: documentId},
        documentType
      ).subscribe((ev: RemoteSnapshotVersionEvent) => {
        controller.handleRemoteMutation(ev)
      })
    }
    return () => {
      if (snapshotsSubscriptionRef.current) {
        snapshotsSubscriptionRef.current.unsubscribe()
        snapshotsSubscriptionRef.current = null
      }
    }
  }, [client, controller, documentId, documentType])

  return {
    timelineController$,
  }
}
