import {type SanityClient} from '@sanity/client'
import {type MendozaPatch, type TransactionLogEventWithEffects} from '@sanity/types'
import {BehaviorSubject, filter, map, type Observable} from 'rxjs'

import {getDraftId, getPublishedId, isVersionId} from '../../util/draftUtils'
import {getDocumentVariantType} from '../../util/getDocumentVariantType'
import {type DocumentRemoteMutationEvent} from '../_legacy/document/buffered-doc/types'
import {remoteSnapshots, type WithVersion} from '../_legacy/document/document-pair'
import {getEditEvents, getEffectState} from './getEditEvents'
import {remoteMutationToTransaction} from './utils'

interface GetRemoteTransactionsSubscriptionOptions {
  client: SanityClient
  documentId: string
  documentType: string
  isLiveEdit: boolean
  serverActionsEnabled: Observable<boolean>
  onRefetch: () => void
}

export function getRemoteTransactionsSubscription({
  client,
  isLiveEdit,
  documentId,
  documentType,
  serverActionsEnabled,
  onRefetch,
}: GetRemoteTransactionsSubscriptionOptions) {
  const remoteTransactions$ = new BehaviorSubject<TransactionLogEventWithEffects[]>([])
  const remoteEdits$ = remoteTransactions$.pipe(
    map((transactions) => getEditEvents(transactions, documentId, isLiveEdit)),
  )

  const documentVariantType = getDocumentVariantType(documentId)
  const onMutationReceived = (remoteMutation: WithVersion<DocumentRemoteMutationEvent> | null) => {
    if (!remoteMutation) return
    // If the remote mutation happened to a published document we need to re-fetch the events.
    // If it happens to a version, we need to add the mutation to the list of events.
    // If it happens to a draft: we need to decide if it looks like an event
    //       Looks like an event: we need to refetch the events list (e.g. publish, discard)
    //       Doesn't look like an event: we need to add the mutation to the list of events.
    const variant = remoteMutation.version
    if (variant !== documentVariantType) {
      // The mutation is not for the current document variant, we don't need to do anything.
      return
    }
    if (variant === 'published' && !isLiveEdit) {
      onRefetch()
      return
    }

    const effectState = getEffectState({
      apply: remoteMutation.effects.apply as MendozaPatch,
      revert: remoteMutation.effects.revert as MendozaPatch,
    })
    if (effectState === 'created' || effectState === 'deleted') {
      onRefetch()
      return
    }
    remoteTransactions$.next([
      ...remoteTransactions$.value,
      remoteMutationToTransaction(remoteMutation),
    ])
  }

  const subscription = remoteSnapshots(
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
  ).pipe(filter((event) => event.type === 'remoteMutation'))

  return {
    remoteTransactions$,
    remoteEdits$,
    subscribe: () => subscription.subscribe(onMutationReceived),
  }
}
