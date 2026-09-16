import {type SanityClient} from '@sanity/client'
import {type MendozaPatch, type TransactionLogEventWithEffects} from '@sanity/types'
import {BehaviorSubject, filter, map} from 'rxjs'

import {getDraftId, getPublishedId, isVersionId} from '../../util/draftUtils'
import {type DocumentVariantType, getDocumentVariantType} from '../../util/getDocumentVariantType'
import {type DocumentRemoteMutationEvent} from '../document/buffered-doc/types'
import {type WithVersion} from '../document/document-pair/checkoutPair'
import {remoteSnapshots} from '../document/document-pair/remoteSnapshots'
import {getEditEvents, getEffectState} from './getEditEvents'
import {remoteMutationToTransaction} from './utils'

interface GetRemoteTransactionsSubscriptionOptions {
  client: SanityClient
  documentId: string
  documentType: string
  isLiveEdit: boolean
  onRefetch: () => void
}

/** What the events store should do with an incoming remote mutation. */
export type RemoteMutationVerdict = 'ignore' | 'refetch' | 'refetch-and-clear' | 'append'

/**
 * Decides how the events store should react to a remote mutation, given the variant being viewed:
 *
 * - `'ignore'`: the mutation is for a *different* variant than the one being viewed.
 * - `'refetch'`: mutation on the published document (non-liveEdit) — publishes/unpublishes are
 *   lifecycle events the API must provide.
 * - `'refetch-and-clear'`: effect state `'created'` or `'deleted'` — the event list changed shape,
 *   so accumulated remote transactions are stale and must be cleared.
 * - `'append'`: effect state `'modified'` — the mutation can be synthesized locally as an edit
 *   event and appended to the accumulated remote transactions.
 */
export function classifyRemoteMutation(
  remoteMutation: WithVersion<DocumentRemoteMutationEvent>,
  {
    documentVariantType,
    isLiveEdit,
  }: {documentVariantType: DocumentVariantType; isLiveEdit: boolean},
): RemoteMutationVerdict {
  const variant = remoteMutation.version
  if (variant !== documentVariantType) {
    return 'ignore'
  }
  if (variant === 'published' && !isLiveEdit) {
    return 'refetch'
  }
  const effectState = getEffectState({
    apply: remoteMutation.effects.apply as MendozaPatch,
    revert: remoteMutation.effects.revert as MendozaPatch,
  })
  if (effectState === 'created' || effectState === 'deleted') {
    return 'refetch-and-clear'
  }
  return 'append'
}

/**
 * Sets up the real-time side of the events store: listens to remote mutations on the document
 * pair (draft + published + version when applicable) and executes the verdict returned by
 * {@link classifyRemoteMutation} for each mutation:
 *
 * - `'ignore'` → nothing happens.
 * - `'refetch'` → `onRefetch()`.
 * - `'refetch-and-clear'` → `onRefetch()` and the accumulated transactions are cleared.
 * - `'append'` → the mutation is converted via `remoteMutationToTransaction` and appended to
 *   `remoteTransactions$`; `remoteEdits$` maps the accumulated transactions through
 *   `getEditEvents` so they render as (live) edit events without refetching.
 *
 * Returns `remoteTransactions$` (consumed by `getDocumentChanges` for diffing while viewing the
 * latest version), `remoteEdits$` (merged into the events list), and `subscribe` which activates
 * the listener and returns the rxjs subscription.
 *
 * Known quirk: `remoteTransactions$` only resets on created/deleted effects, so it accumulates
 * without bound during long editing sessions (tracked as a known issue).
 */
export function getRemoteTransactionsSubscription({
  client,
  isLiveEdit,
  documentId,
  documentType,
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
    const verdict = classifyRemoteMutation(remoteMutation, {documentVariantType, isLiveEdit})
    switch (verdict) {
      case 'ignore':
        // The mutation is not for the current document variant, we don't need to do anything.
        return
      case 'refetch':
        onRefetch()
        return
      case 'refetch-and-clear':
        onRefetch()
        remoteTransactions$.next([])
        return
      case 'append':
        remoteTransactions$.next([
          ...remoteTransactions$.value,
          remoteMutationToTransaction(remoteMutation),
        ])
        return
      default:
        verdict satisfies never
    }
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
  ).pipe(filter((event) => event.type === 'remoteMutation'))

  return {
    remoteTransactions$,
    remoteEdits$,
    subscribe: () => subscription.subscribe(onMutationReceived),
  }
}
