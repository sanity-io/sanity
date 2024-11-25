/* eslint-disable max-nested-callbacks */
import {useCallback, useMemo} from 'react'
import {BehaviorSubject} from 'rxjs'
import {
  type MendozaPatch,
  type SanityClient,
  type TransactionLogEventWithEffects,
  type WithVersion,
} from 'sanity'

import {type DocumentVariantType} from '../../util/draftUtils'
import {type DocumentRemoteMutationEvent} from '../_legacy/document/buffered-doc/types'
import {getEffectState} from './getEditEvents'
import {useRemoteMutations} from './useRemoteMutations'

function remoteMutationToTransaction(
  event: DocumentRemoteMutationEvent,
): TransactionLogEventWithEffects {
  return {
    author: event.author,
    documentIDs: [],
    id: event.transactionId,
    timestamp: event.timestamp.toISOString(),
    effects: {
      [event.head._id]: {
        // TODO: Find a way to validate that is a MendozaPatch
        apply: event.effects.apply as MendozaPatch,
        revert: event.effects.revert as MendozaPatch,
      },
    },
  }
}

export function useRemoteTransactions({
  client,
  documentId,
  documentType,
  documentVariantType,
  onRefetch,
}: {
  client: SanityClient
  documentId: string
  documentType: string
  documentVariantType: DocumentVariantType
  onRefetch: () => void
}) {
  const remoteTransactions$ = useMemo(
    () => new BehaviorSubject<TransactionLogEventWithEffects[]>([]),
    [],
  )

  const handleReceiveMutation = useCallback(
    (remoteMutation: WithVersion<DocumentRemoteMutationEvent>) => {
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
      if (variant === 'version') {
        remoteTransactions$.next([
          ...remoteTransactions$.value,
          remoteMutationToTransaction(remoteMutation),
        ])
        return
      }
      if (variant === 'draft') {
        const effectState = getEffectState({
          apply: remoteMutation.effects.apply as MendozaPatch,
          revert: remoteMutation.effects.revert as MendozaPatch,
        })
        if (effectState === 'upsert' || effectState === 'unedited') {
          remoteTransactions$.next([
            ...remoteTransactions$.value,
            remoteMutationToTransaction(remoteMutation),
          ])
        } else {
          onRefetch()
        }
        return
      }
      if (variant === 'published') {
        onRefetch()
        return
      }
      console.error('Unknown variant', variant)
    },
    [remoteTransactions$, onRefetch, documentVariantType],
  )

  useRemoteMutations({
    client,
    documentId,
    documentType,
    onMutationReceived: handleReceiveMutation,
  })
  return remoteTransactions$
}
