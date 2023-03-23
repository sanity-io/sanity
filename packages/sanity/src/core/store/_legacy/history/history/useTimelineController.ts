import {SanityClient} from '@sanity/client'
import {useCallback, useEffect, useMemo, useRef} from 'react'
import {Subscription} from 'rxjs'
import {Timeline, TimelineController} from '../../../..'
import {useClient} from '../../../../hooks'
import {DEFAULT_STUDIO_CLIENT_OPTIONS} from '../../../../studioClient'
import {remoteSnapshots, RemoteSnapshotVersionEvent} from '../../document'
// import {Timeline} from './Timeline'

interface UseTimelineControllerOpts {
  documentId: string
  documentType: string
  timeline: Timeline
}

/** @internal */
export function useTimelineController({
  documentId,
  documentType,
  timeline,
}: UseTimelineControllerOpts): {
  historyController: TimelineController
} {
  const client = useClient(DEFAULT_STUDIO_CLIENT_OPTIONS)

  const historyController = useMemo(() => {
    return new TimelineController({
      client,
      documentId,
      documentType,
      handler: (err) => {
        if (err) throw err
      },
      timeline,
    })
  }, [client, documentId, documentType, timeline])

  // TODO: understand why this is firing immediately in strict mode
  const handleSnapshot = useCallback(
    (ev: RemoteSnapshotVersionEvent) => {
      historyController.handleRemoteMutation(ev)
    },
    [historyController]
  )

  /**
   * Subscribe to document snapshots
   */
  useFetchSnapshots({client, documentId, documentType, onSnapshot: handleSnapshot})

  /**
   * Resume / suspend controller fetching on mount / unmount
   */
  useEffect(() => {
    historyController.resume()
    return () => {
      historyController.suspend()
    }
  }, [historyController])

  return {
    historyController,
  }
}

interface UseFetchSnapshotsOpts {
  client: SanityClient
  documentId: string
  documentType: string
  onSnapshot: (event: RemoteSnapshotVersionEvent) => void
}

function useFetchSnapshots({client, documentId, documentType, onSnapshot}: UseFetchSnapshotsOpts) {
  const snapshotsRef = useRef<Subscription | null>(null)

  useEffect(() => {
    // Fetch document snapshots and update controller
    if (!snapshotsRef.current) {
      snapshotsRef.current = remoteSnapshots(
        client,
        {
          publishedId: documentId,
          draftId: `drafts.${documentId}`,
        },
        documentType
      ).subscribe(onSnapshot)
    }
    return () => {
      if (snapshotsRef.current) {
        snapshotsRef.current.unsubscribe()
        snapshotsRef.current = null
      }
    }
  }, [client, documentId, documentType, onSnapshot])
}
