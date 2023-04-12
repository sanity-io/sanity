import {ObjectDiff} from '@sanity/diff'
import {useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore} from 'react'
import deepEquals from 'react-fast-compare'
import {BehaviorSubject, catchError, distinctUntilChanged, map, of, Subscription, tap} from 'rxjs'
import {Annotation, Chunk, SelectionState, TimelineController, useHistoryStore} from '../../..'
import {useClient} from '../../../hooks'
import {DEFAULT_STUDIO_CLIENT_OPTIONS} from '../../../studioClient'
import {remoteSnapshots, RemoteSnapshotVersionEvent} from '../document'

interface UseTimelineControllerOpts {
  documentId: string
  documentType: string
  rev?: string
  since?: string
}

/** @internal */
export interface TimelineState {
  chunks: Chunk[]
  diff: ObjectDiff<Annotation, Record<string, any>> | null
  hasMoreChunks: boolean
  isLoading: boolean
  onOlderRevision: boolean
  realRevChunk: Chunk | null
  revTime: Chunk | null
  selectionState: SelectionState
  sinceAttributes: Record<string, unknown> | null
  sinceTime: Chunk | null
  timelineDisplayed: Record<string, unknown> | null
  timelineReady: boolean
}

const INITIAL_TIMELINE_STATE: TimelineState = {
  chunks: [],
  diff: null,
  hasMoreChunks: false,
  isLoading: false,
  onOlderRevision: false,
  realRevChunk: null,
  revTime: null,
  selectionState: 'inactive',
  sinceAttributes: null,
  sinceTime: null,
  timelineDisplayed: null,
  timelineReady: false,
}

/**
 * Handles the creation of a document Timeline and TimelineController, returning a custom hook
 * which can be used to subscribe to selected state changes (via `useSyncExternalStore`)
 *
 * @internal
 * */
export function useTimelineController({
  documentId,
  documentType,
  rev,
  since,
}: UseTimelineControllerOpts): {
  timelineError: Error | null
  timelineFindRangeForRev: TimelineController['findRangeForNewRev']
  timelineFindRangeForSince: TimelineController['findRangeForNewSince']
  timelineLoadMore: () => void
  useTimelineSelector: <ReturnValue>(
    selector: (timelineState: TimelineState) => ReturnValue
  ) => ReturnValue
} {
  const historyStore = useHistoryStore()
  const snapshotsSubscriptionRef = useRef<Subscription | null>(null)
  const timelineStateRef = useRef<TimelineState>(INITIAL_TIMELINE_STATE)
  const client = useClient(DEFAULT_STUDIO_CLIENT_OPTIONS)
  const [timelineError, setTimelineError] = useState<Error | null>(null)

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
      if (err) {
        timelineController$.error(err)
      } else {
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

  /**
   * Custom hook which wraps around `useSyncExternalStore`. Accepts a selector function which can be used
   * to opt-in to specific state updates.
   */
  const useTimelineSelector = <ReturnValue>(
    selector: (timelineState: TimelineState) => ReturnValue
  ) => {
    const subscribe = useCallback((callback: () => void) => {
      const subscription = timelineController$
        .pipe(
          // Manually stop loading transactions in TimelineController, otherwise transaction history
          // will continue to be fetched – even if unwanted.
          tap((innerController) => innerController.setLoadMore(false)),
          map((innerController) => ({
            chunks: innerController.timeline.mapChunks((c) => c),
            diff: innerController.sinceTime ? innerController.currentObjectDiff() : null,
            isLoading: false,
            hasMoreChunks: !innerController.timeline.reachedEarliestEntry,
            onOlderRevision: innerController.onOlderRevision(),
            realRevChunk: innerController.realRevChunk,
            revTime: innerController.revTime,
            selectionState: innerController.selectionState,
            sinceAttributes: innerController.sinceAttributes(),
            sinceTime: innerController.sinceTime,
            timelineDisplayed: innerController.displayed(),
            timelineReady: !['invalid', 'loading'].includes(innerController.selectionState),
          })),
          // Only emit (and in turn, re-render) when values have changed
          distinctUntilChanged(deepEquals),
          tap((timelineState) => {
            timelineStateRef.current = timelineState
          }),
          // Emit initial timeline state whenever we encounter an error in TimelineController's `handler` callback.
          // A little ham-fisted, but also reflects how we handle timeline errors in the UI
          // (i.e. no timeline state or diffs are rendered and we revert to the current editable document)
          catchError((err) => {
            setTimelineError(err)
            return of(INITIAL_TIMELINE_STATE)
          }),
          // Trigger callback function required by `useSyncExternalStore` to denote when to re-render
          tap(callback)
        )
        .subscribe()

      return () => subscription.unsubscribe()
    }, [])

    const getSnapshot = useCallback(() => selector(timelineStateRef.current), [selector])

    return useSyncExternalStore(subscribe, getSnapshot)
  }

  const handleFindRangeForRev = useCallback(
    (chunk: Chunk) => controller.findRangeForNewRev(chunk),
    [controller]
  )

  const handleFindRangeForSince = useCallback(
    (chunk: Chunk) => controller.findRangeForNewSince(chunk),
    [controller]
  )

  const handleLoadMore = useCallback(() => {
    controller.setLoadMore(true)
    timelineStateRef.current.isLoading = true
  }, [controller])

  return {
    timelineError,
    timelineFindRangeForRev: handleFindRangeForRev,
    timelineFindRangeForSince: handleFindRangeForSince,
    timelineLoadMore: handleLoadMore,
    useTimelineSelector,
  }
}
