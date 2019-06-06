import {isEqual, uniq} from 'lodash'
import {HistoryEvent, Transaction, Mutation} from './types'
import {ndjsonToArray} from './utils/ndjsonToArray'

const EDIT_EVENT_TIME_TRESHHOLD_MS = 5 * 1000 * 60 * 5 // 5 minutes

export function transactionsToEvents(
  documentId: string,
  transactions: string | Buffer | Transaction[]
): HistoryEvent[] {
  const rawItems = Array.isArray(transactions) ? transactions : ndjsonToArray(transactions)
  return (
    rawItems
      // Make sure we only deal with ids that are for our document (including the draft)
      .filter(
        (transaction: Transaction) =>
          transaction.documentIDs &&
          (transaction.documentIDs.includes(documentId) ||
            transaction.documentIDs.includes(`drafts.${documentId}`))
      )
      // ensure transactions are sorted by time
      .sort(compareTimestamp)
      // Turn a transaction into a classified HistoryEvent
      .map(mapToEvents)
      // Chunk and group edit events
      .reduce(reduceEdits, [])
  )
}

function mapToEvents(transaction: Transaction): HistoryEvent {
  const type = mutationsToEventType(transaction.mutations)
  const timestamp = new Date(transaction.timestamp)
  return {
    type,
    documentIDs: transaction.documentIDs,
    rev: transaction.id,
    userIds: [transaction.author],
    startTime: timestamp,
    endTime: timestamp
  }
}

function reduceEdits(
  acc: HistoryEvent[],
  current: HistoryEvent,
  index: number,
  arr: HistoryEvent[]
) {
  const nextEvent = arr[index + 1]
  const skipEvent =
    current.type === 'edited' &&
    nextEvent &&
    nextEvent.type === 'edited' &&
    nextEvent.endTime.getTime() - current.endTime.getTime() < EDIT_EVENT_TIME_TRESHHOLD_MS &&
    isEqual(current.documentIDs, nextEvent.documentIDs)
  if (skipEvent) {
    // Lift authors over to next event
    nextEvent.userIds = uniq(nextEvent.userIds.concat(current.userIds))
    // Set startTime on next event to be this one if not done already
    // (then startTime and endTime would be different)
    if (current.startTime.getTime() === current.endTime.getTime()) {
      nextEvent.startTime = current.startTime
    }
  } else {
    acc.push(current)
  }
  return acc
}

export function mutationsToEventType(mutations: Mutation[]) {
  const withoutPatches = mutations.filter(mut => mut.patch === undefined)
  // Created
  if (
    mutations[0].createIfNotExists &&
    mutations[0].createIfNotExists._id.startsWith('drafts.') &&
    mutations[1] &&
    mutations[1].patch &&
    mutations[1].patch.id.startsWith('drafts.') &&
    mutations[1].patch.set !== undefined
  ) {
    return 'created'
  }

  // Published
  if (
    withoutPatches.length === 2 &&
    (withoutPatches.some(patch => patch.delete) ||
      withoutPatches.some(patch => patch.createOrReplace)) &&
    withoutPatches.some(patch => patch.delete && patch.delete.id.startsWith('drafts.'))
  ) {
    return 'published'
  }

  // Unpublished
  if (
    withoutPatches.length === 2 &&
    withoutPatches.some(
      patch =>
        (patch.createIfNotExists && patch.createIfNotExists._id.startsWith('drafts.')) ||
        (patch.create && patch.create._id.startsWith('drafts.'))
    ) &&
    withoutPatches.some(patch => patch.delete && !patch.delete.id.startsWith('drafts.'))
  ) {
    return 'unpublished'
  }

  // Restored (return edited for now)
  if (
    mutations.length === 1 &&
    mutations[0].createOrReplace &&
    mutations[0].createOrReplace._id.startsWith('drafts.')
  ) {
    return 'edited'
  }

  // Edited
  if (mutations.some(mut => mut.patch)) {
    return 'edited'
  }

  return 'unknown'
}

function compareTimestamp(a: Transaction, b: Transaction) {
  return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
}
