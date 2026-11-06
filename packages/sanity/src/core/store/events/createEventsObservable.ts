import {type TransactionLogEventWithEffects} from '@sanity/types'
import {combineLatest, map, type Observable} from 'rxjs'

import {type DocumentVariantType, getDocumentVariantType} from '../../util/getDocumentVariantType'
import {getEditEvents} from './getEditEvents'
import {type FetchedEventsValue, HISTORY_CLEARED_EVENT_ID} from './getInitialFetchEvents'
import {
  type DocumentGroupEvent,
  type EditDocumentVersionEvent,
  type EventsObservableValue,
  type UpdateLiveDocumentEvent,
} from './types'
import {
  addParentToEvents,
  removeDupes,
  sortEvents,
  squashLiveEditEvents,
  updateVersionEvents,
} from './utils'

interface CreateEventsObservableOptions {
  documentId: string
  isLiveEdit: boolean
  events$: Observable<FetchedEventsValue>
  remoteTransactions$: Observable<TransactionLogEventWithEffects[]>
  expandedEvents$: Observable<EditDocumentVersionEvent[]>
}

const addDocumentVariantTypeToEvents = (
  events: DocumentGroupEvent[],
  documentVariantType: DocumentVariantType,
) => {
  return events.map((event) => ({...event, documentVariantType}))
}

/**
 * Synthesizes the edit events from every translog transaction the store holds, fetched and
 * received live alike, so an edit is grouped the same way however the store got it.
 *
 * Each fetched batch covers one stretch of the document's lifecycle: reloads start when the viewed
 * variant is created, deleted or published, and that also clears the remote transactions. So the
 * newest batch is grouped together with the remote transactions, while older batches are grouped
 * on their own and an edit event never spans a publish, a discard or a recreation. A transaction
 * in more than one batch is grouped with the newest one.
 */
export function getEditEventsFromTransactions({
  transactionBatches,
  remoteTransactions,
  documentId,
  liveEdit,
}: {
  transactionBatches: TransactionLogEventWithEffects[][]
  remoteTransactions: TransactionLogEventWithEffects[]
  documentId: string
  liveEdit: boolean
}): (EditDocumentVersionEvent | UpdateLiveDocumentEvent)[] {
  const segments = [
    ...transactionBatches.slice(0, -1),
    [...(transactionBatches.at(-1) ?? []), ...remoteTransactions],
  ]
  const seen = new Set<string>()
  return segments.toReversed().flatMap((segment) => {
    const transactions = segment.filter((transaction) => {
      if (seen.has(transaction.id)) return false
      seen.add(transaction.id)
      return true
    })
    return getEditEvents(transactions, documentId, liveEdit)
  })
}

/**
 * When the document's history was cleared (a fetch found edits in the translog but no events in
 * the events API), prepends a synthetic `historyCleared` event (id
 * {@link HISTORY_CLEARED_EVENT_ID}), timestamped 1ms before the oldest edit event so it sorts
 * after it. Returns `editEvents` untouched otherwise.
 */
export function withHistoryClearedEvent(
  editEvents: DocumentGroupEvent[],
  {
    historyCleared,
    documentId,
    documentVariantType,
  }: {
    historyCleared: boolean
    documentId: string
    documentVariantType: DocumentVariantType
  },
): DocumentGroupEvent[] {
  if (!historyCleared || editEvents.length === 0) return editEvents

  const clearedEventTimestamp = new Date(editEvents[editEvents.length - 1].timestamp).getTime() - 1
  return [
    {
      type: 'historyCleared',
      documentId,
      id: HISTORY_CLEARED_EVENT_ID,
      timestamp: new Date(clearedEventTimestamp).toISOString(),
      author: '',
      documentVariantType,
    },
    ...editEvents,
  ]
}

/**
 * Applies the variant-specific transforms to a sorted event list:
 * 1. The per-variant transform:
 *    - draft: link edits/creates to their publish events ({@link addParentToEvents})
 *    - version: re-point publish events at the version id ({@link updateVersionEvents})
 *    - published: pass through untouched
 * 2. Stamp every event with the `documentVariantType` of the viewed document.
 * 3. Squash same-author live-edit events within the merge window
 *    ({@link squashLiveEditEvents}; temporary until the API squashes them).
 */
export function applyVariantTransforms(
  events: DocumentGroupEvent[],
  documentVariantType: DocumentVariantType,
): DocumentGroupEvent[] {
  let transformed = events
  if (documentVariantType === 'draft') {
    transformed = addParentToEvents(events)
  } else if (documentVariantType === 'version') {
    transformed = updateVersionEvents(events)
  }
  transformed = addDocumentVariantTypeToEvents(transformed, documentVariantType)
  // TODO: This is temporal - liveEditEvents will be squashed in the API
  return squashLiveEditEvents(transformed)
}

/**
 * Combines the three event sources (fetched events and transactions, live remote transactions,
 * user-expanded edit events) into the final event list the UI consumes.
 *
 * Per emission:
 * 1. Synthesizes the edit events from the fetched and remote transactions together
 *    ({@link getEditEventsFromTransactions}), plus the `historyCleared` event when needed
 *    ({@link withHistoryClearedEvent}). Live edit events (`updateLiveDocument`) are only
 *    synthesized for the published document of a live edit type.
 * 2. Merges them with the fetched events via {@link removeDupes}, so a publish or delete event
 *    replaces the edit event that shares its id.
 * 3. Sorts everything newest-first ({@link sortEvents}) and applies the variant transforms
 *    ({@link applyVariantTransforms}).
 */
export function createEventsObservable({
  documentId,
  isLiveEdit,
  events$,
  remoteTransactions$,
  expandedEvents$,
}: CreateEventsObservableOptions): Observable<EventsObservableValue> {
  const documentVariantType = getDocumentVariantType(documentId)
  const liveEdit = isLiveEdit && documentVariantType === 'published'
  return combineLatest([events$, remoteTransactions$, expandedEvents$]).pipe(
    map(([fetched, remoteTransactions, expandedEvents]) => {
      const editEvents = getEditEventsFromTransactions({
        transactionBatches: fetched.transactionBatches,
        remoteTransactions,
        documentId,
        liveEdit,
      })
      const events = removeDupes(
        withHistoryClearedEvent(editEvents, {
          historyCleared: fetched.historyCleared,
          documentId,
          documentVariantType,
        }),
        fetched.events,
      )
      return {
        events: applyVariantTransforms(sortEvents({events, expandedEvents}), documentVariantType),
        nextCursor: fetched.nextCursor,
        loading: fetched.loading,
        error: fetched.error,
      }
    }),
  )
}
