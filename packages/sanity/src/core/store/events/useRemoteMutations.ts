import {type SanityClient} from '@sanity/client'
import {useEffect, useMemo, useRef} from 'react'
import {of, type Subscription, switchMap} from 'rxjs'

import {useWorkspace} from '../../studio/workspace'
import {getDraftId, getPublishedId, isVersionId} from '../../util/draftUtils'
import {type DocumentRemoteMutationEvent} from '../_legacy/document/buffered-doc/types'
import {remoteSnapshots, type WithVersion} from '../_legacy/document/document-pair'
import {fetchFeatureToggle} from '../_legacy/document/document-pair/utils/fetchFeatureToggle'

/**
 * This hooks takes care of listening to the transactions
 * received for a single document, it doesn't take the documentPair.
 */
export function useRemoteMutations({
  client,
  onUpdate,
  documentId,
  documentType,
}: {
  client: SanityClient
  documentId: string
  documentType: string
  onUpdate: (event: WithVersion<DocumentRemoteMutationEvent>) => void
}) {
  const snapshotsSubscriptionRef = useRef<Subscription | null>(null)
  const workspace = useWorkspace()

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
        {
          draftId: getDraftId(documentId),
          publishedId: getPublishedId(documentId),
          ...(isVersionId(documentId)
            ? {
                versionId: documentId,
              }
            : {}),
        },
        documentType,
        serverActionsEnabled,
      )
        .pipe(
          switchMap((event) => {
            // Type could be 'snapshot' or 'remoteMutation', we don't want the snapshots
            if (event.type !== 'remoteMutation') {
              return of(null)
            }
            return of(null)
          }),
        )
        .subscribe((ev) => {
          if (ev) onUpdate(ev)
        })
    }
    return () => {
      if (snapshotsSubscriptionRef.current) {
        snapshotsSubscriptionRef.current.unsubscribe()
        snapshotsSubscriptionRef.current = null
      }
    }
  }, [client, documentId, documentType, onUpdate, serverActionsEnabled])
}
