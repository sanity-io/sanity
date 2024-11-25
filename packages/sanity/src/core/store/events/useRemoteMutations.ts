import {type SanityClient} from '@sanity/client'
import {useEffect, useMemo, useRef} from 'react'
import {filter, of, type Subscription} from 'rxjs'

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
  onMutationReceived,
  documentId,
  documentType,
}: {
  client: SanityClient
  documentId: string
  documentType: string
  onMutationReceived: (mutation: WithVersion<DocumentRemoteMutationEvent>) => void
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
        .pipe(filter((event) => event.type === 'remoteMutation'))
        .subscribe((ev) => {
          if (ev) onMutationReceived(ev)
        })
    }
    return () => {
      if (snapshotsSubscriptionRef.current) {
        snapshotsSubscriptionRef.current.unsubscribe()
        snapshotsSubscriptionRef.current = null
      }
    }
  }, [client, documentId, documentType, onMutationReceived, serverActionsEnabled])
}
