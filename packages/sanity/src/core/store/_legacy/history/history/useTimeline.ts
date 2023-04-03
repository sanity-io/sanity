import {ObjectDiff} from '@sanity/diff'
import {useCallback, useEffect, useMemo, useRef, useState} from 'react'
import {BehaviorSubject, Subscription} from 'rxjs'
import {
  Annotation,
  Chunk,
  isDev,
  SelectionState,
  TimelineController,
  useHistoryStore,
} from '../../../..'
import {useClient} from '../../../../hooks'
import {DEFAULT_STUDIO_CLIENT_OPTIONS} from '../../../../studioClient'
import {remoteSnapshots, RemoteSnapshotVersionEvent} from '../../document'

interface UseTimelineControllerOpts {
  documentId: string
  documentType: string
  rev?: string
  since?: string
}

/** @internal */
export interface TimelineState {
  changesOpen: boolean
  currentObjectDiff: ObjectDiff<Annotation> | null
  displayed: Record<string, unknown> | null
  hasMoreChunks: boolean
  onOlderRevision: boolean
  ready: boolean
  realRevChunk: Chunk | null
  revTime: Chunk | null
  selectionState: SelectionState
  sinceAttributes: Record<string, unknown> | null
  sinceTime: Chunk | null
}

const INITIAL_STATE: TimelineState = {
  changesOpen: false,
  currentObjectDiff: null,
  displayed: null,
  hasMoreChunks: false,
  onOlderRevision: false,
  ready: false,
  realRevChunk: null,
  revTime: null,
  selectionState: 'inactive',
  sinceAttributes: null,
  sinceTime: null,
}

/** @internal */
export function useTimeline({documentId, documentType, rev, since}: UseTimelineControllerOpts): {
  timelineChunks$: BehaviorSubject<Chunk[]>
  timelineController: TimelineController
  timelineState: TimelineState
} {
  const historyStore = useHistoryStore()
  const snapshotsRef = useRef<Subscription | null>(null)
  const client = useClient(DEFAULT_STUDIO_CLIENT_OPTIONS)

  const [timelineState, setTimelineState] = useState<TimelineState>(INITIAL_STATE)

  const timelineController = useMemo(() => {
    const timeline = historyStore.getTimeline({publishedId: documentId, enableTrace: isDev})
    return new TimelineController({client, documentId, documentType, timeline})
  }, [client, documentId, documentType])

  const timelineChunks$ = useMemo(
    () => new BehaviorSubject<Chunk[]>(timelineController.timeline.mapChunks((c) => c)),
    [timelineController.timeline]
  )

  const updateState = useCallback(
    (controller: TimelineController) => {
      controller.setRange(since || null, rev || null)

      setTimelineState({
        changesOpen: !!since,
        currentObjectDiff: since ? controller.currentObjectDiff() : null,
        displayed: controller.displayed(),
        hasMoreChunks: !controller.timeline.reachedEarliestEntry,
        onOlderRevision: controller.onOlderRevision(),
        ready: !['invalid', 'loading'].includes(controller.selectionState),
        realRevChunk: controller.realRevChunk,
        revTime: controller.revTime,
        selectionState: controller.selectionState,
        sinceAttributes: controller.sinceAttributes(),
        sinceTime: controller.sinceTime,
      })
    },
    [rev, since]
  )

  /**
   * Resume / suspend controller fetching on mount / unmount
   */
  useEffect(() => {
    updateState(timelineController)
    timelineController.handler = (err, innerController) => {
      if (!err) {
        setTimeout(() => {
          updateState(innerController)
          timelineChunks$.next(innerController.timeline.mapChunks((c) => c))
        }, 0)
      }
    }
    timelineController.resume()
    return () => timelineController.suspend()
  }, [rev, since, timelineChunks$, timelineController, updateState])

  /**
   * Fetch document snapshots and update controller
   */
  useEffect(() => {
    if (!snapshotsRef.current) {
      snapshotsRef.current = remoteSnapshots(
        client,
        {draftId: `drafts.${documentId}`, publishedId: documentId},
        documentType
      ).subscribe((ev: RemoteSnapshotVersionEvent) => {
        timelineController.handleRemoteMutation(ev)
      })
    }
    return () => {
      if (snapshotsRef.current) {
        snapshotsRef.current.unsubscribe()
        snapshotsRef.current = null
      }
    }
  }, [client, documentId, documentType, timelineController])

  return {
    timelineController,
    timelineState,
    timelineChunks$,
  }
}
