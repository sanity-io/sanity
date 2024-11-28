/* eslint-disable max-nested-callbacks */
import {useCallback, useMemo} from 'react'
import {BehaviorSubject, map} from 'rxjs'
import {
  type MendozaPatch,
  type ObjectSchemaType,
  type SanityClient,
  type TransactionLogEventWithEffects,
  useSchema,
  type WithVersion,
} from 'sanity'

import {type DocumentVariantType} from '../../util/draftUtils'
import {type DocumentRemoteMutationEvent} from '../_legacy/document/buffered-doc/types'
import {getEditEvents, getEffectState} from './getEditEvents'
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
  const schema = useSchema()
  const schemaType = schema.get(documentType) as ObjectSchemaType | undefined
  const isLiveEdit = Boolean(schemaType?.liveEdit)

  const remoteTransactions$ = useMemo(
    () => new BehaviorSubject<TransactionLogEventWithEffects[]>([]),
    [],
  )
  const remoteEdits$ = remoteTransactions$.pipe(
    map((transactions) => getEditEvents(transactions, documentId, isLiveEdit)),
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
      if (variant === 'published' && !isLiveEdit) {
        onRefetch()
        return
      }

      const effectState = getEffectState({
        apply: remoteMutation.effects.apply as MendozaPatch,
        revert: remoteMutation.effects.revert as MendozaPatch,
      })
      if (effectState !== 'upsert' && effectState !== 'unedited') {
        onRefetch()
        return
      }
      remoteTransactions$.next([
        ...remoteTransactions$.value,
        remoteMutationToTransaction(remoteMutation),
      ])
    },
    [documentVariantType, isLiveEdit, remoteTransactions$, onRefetch],
  )

  useRemoteMutations({
    client,
    documentId,
    documentType,
    onMutationReceived: handleReceiveMutation,
  })
  return {remoteTransactions$, remoteEdits$}
}
