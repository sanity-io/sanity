import {type ObjectDiff} from '@sanity/diff'
import {useEffect, useMemo, useRef} from 'react'
import deepEquals from 'react-fast-compare'
import {
  BehaviorSubject,
  catchError,
  distinctUntilChanged,
  map,
  of,
  type Subscription,
  tap,
} from 'rxjs'

import {
  type Annotation,
  type Chunk,
  type SelectionState,
  type TimelineController,
  useHistoryStore,
  useWorkspace,
} from '../../..'
import {useClient} from '../../../hooks'
import {DEFAULT_STUDIO_CLIENT_OPTIONS} from '../../../studioClient'
import {remoteSnapshots, type RemoteSnapshotVersionEvent} from '../document'
import {fetchFeatureToggle} from '../document/document-pair/utils/fetchFeatureToggle'

interface UseTimelineControllerOpts {
  documentId: string
  documentType: string
  onError?: (err: Error) => void
  rev?: string
  since?: string
}

/** @internal */
export interface TimelineState {
  chunks: Chunk[]
  diff: ObjectDiff<Annotation, Record<string, any>> | null
  /** null is used here when the chunks hasn't loaded / is not known */
  hasMoreChunks: boolean | null
  isLoading: boolean
  /**
   * Whether this timeline is fully loaded and completely empty (true for new documents)
   * It can be `null` when the chunks hasn't loaded / is not known
   */
  isPristine: boolean | null
  lastNonDeletedRevId: string | null
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
  hasMoreChunks: null,
  isLoading: false,
  isPristine: null,
  lastNonDeletedRevId: null,
  onOlderRevision: false,
  realRevChunk: null,
  revTime: null,
  selectionState: 'inactive',
  sinceAttributes: null,
  sinceTime: null,
  timelineDisplayed: null,
  timelineReady: false,
}

/** @internal */
export interface TimelineStore {
  findRangeForRev: TimelineController['findRangeForNewRev']
  findRangeForSince: TimelineController['findRangeForNewSince']
  loadMore: () => void
  getSnapshot: () => TimelineState
  subscribe: (callback: () => void) => () => void
}

/**
 * Creates a store which handles the creation of a document Timeline,
 * TimelineController and also fetches pre-requisite document snapshots.
 *
 * `TimelineStore` exposes select TimelineController methods used to query
 * ranges and fetch more transactions. It can also be used with
 * `useSyncExternalStore` to subscribe to selected state changes.
 *
 * @internal
 * */
export function useTimelineStore({
  documentId,
  documentType,
  onError,
  rev,
  since,
}: UseTimelineControllerOpts): TimelineStore {
  const historyStore = useHistoryStore()
  const snapshotsSubscriptionRef = useRef<Subscription | null>(null)
  const timelineStateRef = useRef<TimelineState>(INITIAL_TIMELINE_STATE)
  const client = useClient(DEFAULT_STUDIO_CLIENT_OPTIONS)
  const workspace = useWorkspace()

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
    [client, documentId, documentType, historyStore],
  )

  /**
   * A BehaviorSubject which can be subscribed by multiple observers, which broadcasts
   * the the latest state of the (mutable) TimelineController.
   */
  const timelineController$ = useMemo(
    () => new BehaviorSubject<TimelineController>(controller),
    [controller],
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

  const serverActionsEnabled = useMemo(() => {
    const configFlag = workspace.__internal_serverDocumentActions?.enabled
    // If it's explicitly set, let it override the feature toggle
    return typeof configFlag === 'boolean' ? of(configFlag as boolean) : fetchFeatureToggle(client)
  }, [client, workspace.__internal_serverDocumentActions?.enabled])

  /**
   * Fetch document snapshots and update the mutable controller.
   * Unsubscribes on clean up, preventing double fetches in strict mode.
   */
  useEffect(() => {
    if (!snapshotsSubscriptionRef.current) {
      snapshotsSubscriptionRef.current = remoteSnapshots(
        client,
        {draftId: `drafts.${documentId}`, publishedId: documentId},
        documentType,
        serverActionsEnabled,
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
  }, [client, controller, documentId, documentType, serverActionsEnabled])

  const timelineStore = useMemo(() => {
    return {
      findRangeForRev: (chunk: Chunk) => controller.findRangeForNewRev(chunk),
      findRangeForSince: (chunk: Chunk) => controller.findRangeForNewSince(chunk),
      loadMore: () => {
        controller.setLoadMore(true)
      },
      getSnapshot: () => timelineStateRef.current,
      subscribe: (callback: () => void) => {
        const subscription = timelineController$
          .pipe(
            map((innerController) => {
              const chunks = innerController.timeline.mapChunks((c) => c)
              const lastNonDeletedChunk = chunks.filter(
                (chunk) => !['delete', 'initial'].includes(chunk.type),
              )
              const hasMoreChunks = !innerController.timeline.reachedEarliestEntry

              // 'Switch the faucet off' once we know we have enough chunks to reasonably display overflow.
              // Here, 16 is just an arbitrary number which will probably cover most regular screen sizes.
              if (hasMoreChunks && chunks.length > 16) {
                innerController.setLoadMore(false)
              }

              const timelineReady = !['invalid', 'loading'].includes(innerController.selectionState)
              return {
                chunks,
                diff: innerController.sinceTime ? innerController.currentObjectDiff() : null,
                isLoading: innerController.isLoading,
                isPristine: timelineReady ? chunks.length === 0 && hasMoreChunks === false : null,
                hasMoreChunks: !innerController.timeline.reachedEarliestEntry,
                lastNonDeletedRevId: lastNonDeletedChunk?.[0]?.id,
                onOlderRevision: innerController.onOlderRevision(),
                realRevChunk: innerController.realRevChunk,
                revTime: innerController.revTime,
                selectionState: innerController.selectionState,
                sinceAttributes: innerController.sinceAttributes(),
                sinceTime: innerController.sinceTime,
                timelineDisplayed: innerController.displayed(),
                timelineReady,
              }
            }),
            // Only emit (and in turn, re-render) when values have changed
            distinctUntilChanged(deepEquals),
            // Emit initial timeline state whenever we encounter an error in TimelineController's `handler` callback.
            // A little ham-fisted, but also reflects how we handle timeline errors in the UI
            // (i.e. no timeline state or diffs are rendered and we revert to the current editable document)
            catchError((err) => {
              onError?.(err)
              return of(INITIAL_TIMELINE_STATE)
            }),
            tap((timelineState) => {
              timelineStateRef.current = timelineState
            }),
            // Trigger callback function required by `useSyncExternalStore` to denote when to re-render
            tap(callback),
          )
          .subscribe()

        return () => subscription.unsubscribe()
      },
    }
  }, [controller, onError, timelineController$])

  return timelineStore
}
