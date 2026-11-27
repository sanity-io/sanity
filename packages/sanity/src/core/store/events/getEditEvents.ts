import {
  type MendozaEffectPair,
  type MendozaPatch,
  type TransactionLogEventWithEffects,
} from '@sanity/types'

import {getDocumentVariantType} from '../../util/getDocumentVariantType'
import {
  type DocumentGroupEvent,
  type EditDocumentVersionEvent,
  isEditDocumentVersionEvent,
  type UpdateLiveDocumentEvent,
} from './types'
import {isWithinMergeWindow} from './utils'

/**
 * Classifies a mendoza effect pair by what it did to the document:
 * - `'deleted'`: the apply patch deletes the document (`[0, null]`).
 * - `'created'`: the revert patch deletes the document, i.e. applying it forward created it.
 * - `'modified'`: an effect exists but neither creates nor deletes.
 * - `'noop'`: no effect for this document in the transaction.
 *
 * Used to filter edit transactions (only `'modified'` become edit events) and to decide whether a
 * remote mutation requires refetching the event list (created/deleted look like lifecycle events).
 */
export function getEffectState(
  effect?: MendozaEffectPair,
): 'noop' | 'deleted' | 'modified' | 'created' {
  const modified = Boolean(effect)
  const deleted = effect && isDeletePatch(effect?.apply)
  const created = effect && isDeletePatch(effect?.revert)

  if (deleted) {
    return 'deleted'
  }
  if (created) {
    return 'created'
  }

  if (modified) {
    return 'modified'
  }

  return 'noop'
}

function isDeletePatch(patch: MendozaPatch): boolean {
  return patch[0] === 0 && patch[1] === null
}

type EditTransaction = EditDocumentVersionEvent['transactions'][number]

const getEditTransaction = (transaction: TransactionLogEventWithEffects): EditTransaction => {
  return {
    type: 'editTransaction',
    author: transaction.author,
    timestamp: transaction.timestamp,
    revisionId: transaction.id,
  }
}

/**
 * Edit groups the user expanded, as a map from the revision id of each of their transactions to a
 * key shared by all the transactions of the same group. See {@link mergeEditEvents}.
 */
export type FrozenEditGroups = ReadonlyMap<string, string>

const NO_FROZEN_EDIT_GROUPS: FrozenEditGroups = new Map()

/**
 * Groups edit transactions into `editDocumentVersion` events, newest first: a transaction within
 * the merge window (5 min) of the *current group's newest* transaction joins that group, otherwise
 * it starts a new event. Each event takes its id, revision, timestamp and author from its newest
 * transaction, and lists every distinct author in `contributors`.
 *
 * The transactions of a frozen group (see {@link FrozenEditGroups}) only join each other, and no
 * other transaction joins them, whatever their timestamps.
 */
function groupEditTransactions(
  transactions: EditTransaction[],
  documentId: string,
  frozenGroups: FrozenEditGroups = NO_FROZEN_EDIT_GROUPS,
): EditDocumentVersionEvent[] {
  const result: EditDocumentVersionEvent[] = []
  const newestFirst = transactions.toSorted(
    (a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp),
  )
  let groupFrozenKey: string | undefined
  for (const transaction of newestFirst) {
    const group = result.at(-1)
    const frozenKey = frozenGroups.get(transaction.revisionId)
    const joinsGroup =
      frozenKey === undefined
        ? groupFrozenKey === undefined &&
          group !== undefined &&
          isWithinMergeWindow(group.timestamp, transaction.timestamp)
        : groupFrozenKey === frozenKey
    if (group && joinsGroup) {
      group.transactions.push(transaction)
      if (!group.contributors.includes(transaction.author)) {
        group.contributors.push(transaction.author)
      }
      continue
    }
    groupFrozenKey = frozenKey
    result.push({
      type: 'editDocumentVersion',
      documentId,
      id: transaction.revisionId,
      timestamp: transaction.timestamp,
      author: transaction.author,
      contributors: [transaction.author],
      revisionId: transaction.revisionId,
      transactions: [transaction],
      documentVariantType: getDocumentVariantType(documentId),
    })
  }
  return result
}

/**
 * Projects grouped edit events onto the `updateLiveDocument` shape a live-edit document shows.
 * The remote-edits observable applies this after {@link getEditEvents} when the schema is live
 * edit.
 *
 * Known quirk: merged (in-window) transactions are dropped entirely, including those by other
 * authors, losing their attribution (tracked as a known issue; contrast with
 * {@link squashLiveEditEvents}, which only squashes same-author events).
 */
export function toUpdateLiveDocumentEvents(
  events: EditDocumentVersionEvent[],
): UpdateLiveDocumentEvent[] {
  return events.map((event) => ({
    id: event.id,
    timestamp: event.timestamp,
    type: 'updateLiveDocument',
    documentId: event.documentId,
    revisionId: event.revisionId,
    author: event.author,
    documentVariantType: event.documentVariantType,
  }))
}

/**
 * Builds synthetic `editDocumentVersion` events from translog transactions — the events API does
 * not expose edits, so the studio derives them client-side (both for the initial fetch and for
 * real-time remote mutations, which {@link mergeEditEvents} then regroups together). Live-edit
 * documents project these events with {@link toUpdateLiveDocumentEvents} in the remote-edits
 * observable.
 *
 * Behavior:
 * - Only transactions whose effect on `documentId` is `'modified'` are considered
 *   (see {@link getEffectState}); creations and deletions are lifecycle events, not edits.
 * - Transactions are sorted newest-first, then grouped: a transaction within the merge window
 *   (5 min) of the *current group's newest* transaction is merged into that group; otherwise it
 *   starts a new event. Note the window is anchored to the group head, not the previous
 *   transaction, so a continuous editing session splits every 5 minutes.
 * - Merged transactions are appended to `transactions` and distinct authors accumulate in
 *   `contributors`. The event id/revisionId is the *newest* transaction id of the group.
 */
export function getEditEvents(
  transactions: TransactionLogEventWithEffects[],
  documentId: string,
): EditDocumentVersionEvent[] {
  return groupEditTransactions(
    transactions
      // We only care about the transactions that have modified the document
      .filter((tx) => getEffectState(tx.effects[documentId]) === 'modified')
      .map(getEditTransaction),
    documentId,
  )
}

/**
 * Regroups the edit events of a newest-first event list as if all their transactions had been
 * grouped by a single {@link getEditEvents} call. The events store gets edit events from two
 * places, the translog fetched with the events and the transactions received live afterwards,
 * and each one only groups its own transactions; without this, the same edits would be grouped
 * differently depending on when the document was loaded.
 *
 * Only consecutive edit events are regrouped: any other event between them (a creation, a
 * publish, a discard) ends the run, so edits are never grouped across a lifecycle change. A
 * transaction found in more than one event (fetched, and also received live) is kept once. Edit
 * events nested under an expanded publish (they have a `parentId`) are left as they are.
 *
 * `frozenGroups` holds the groups the user expanded: each keeps exactly its transactions, so its
 * id stays the same while new edits keep arriving, and those new edits start a group of their
 * own. A run holding frozen transactions is regrouped even when it is a single edit event, as the
 * live edits are grouped by {@link getEditEvents}, which doesn't know about frozen groups.
 */
export function mergeEditEvents(
  events: DocumentGroupEvent[],
  frozenGroups: FrozenEditGroups = NO_FROZEN_EDIT_GROUPS,
): DocumentGroupEvent[] {
  const result: DocumentGroupEvent[] = []
  let run: EditDocumentVersionEvent[] = []
  const endRun = () => {
    const holdsFrozenTransactions =
      frozenGroups.size > 0 &&
      run.some((event) =>
        event.transactions.some((transaction) => frozenGroups.has(transaction.revisionId)),
      )
    if (run.length > 1 || holdsFrozenTransactions) {
      const seen = new Set<string>()
      const transactions = run
        .flatMap((event) => event.transactions)
        .filter((transaction) => {
          if (seen.has(transaction.revisionId)) return false
          seen.add(transaction.revisionId)
          return true
        })
      result.push(...groupEditTransactions(transactions, run[0].documentId, frozenGroups))
    } else {
      result.push(...run)
    }
    run = []
  }

  for (const event of events) {
    if (isEditDocumentVersionEvent(event) && !event.parentId) {
      run.push(event)
      continue
    }
    endRun()
    result.push(event)
  }
  endRun()
  return result
}

/**
 * Lists the transactions of every grouped edit event as events of their own, right after the
 * group, so the timeline can expand the group and the user can select the document at any of
 * them. Runs last in the events pipeline (after the variant transforms), so the listed
 * transactions are never regrouped or re-parented.
 *
 * - Every transaction of a group of more than one is listed, newest first, so each of them can be
 *   inspected on its own. The newest one is the same revision as the group (or, when
 *   `addParentToEvents` re-pointed the group's id at its second transaction, as the publish event
 *   that follows it), so its id is shared with that event: lookups by id find the group (or the
 *   publish) first, and the timeline highlights the most nested row of a selected id.
 * - Each listed transaction is an `editDocumentVersion` event with that single transaction,
 *   `isTransaction: true` and `parentId` set to the group's id.
 */
export function addEditTransactionEvents(events: DocumentGroupEvent[]): DocumentGroupEvent[] {
  const result: DocumentGroupEvent[] = []
  for (const event of events) {
    result.push(event)
    if (!isEditDocumentVersionEvent(event) || event.isTransaction) continue
    if (event.transactions.length < 2) continue

    for (const transaction of event.transactions) {
      result.push({
        type: 'editDocumentVersion',
        documentId: event.documentId,
        documentVariantType: event.documentVariantType,
        id: transaction.revisionId,
        revisionId: transaction.revisionId,
        timestamp: transaction.timestamp,
        author: transaction.author,
        contributors: [transaction.author],
        transactions: [transaction],
        parentId: event.id,
        isTransaction: true,
      })
    }
  }
  return result
}
