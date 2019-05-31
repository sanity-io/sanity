import {uniq} from 'lodash'
import {HistoryEvent, Transaction, Mutation} from './types'
import {ndjsonToArray} from './utils/ndjsonToArray'

const EDIT_EVENT_TIME_TRESHHOLD_MS = 5 * 1000 * 60 * 5 // 5 minutes

export function transactionsToEvents(
  documentId: string,
  transactions: string | Buffer
): HistoryEvent[] {
  const rawItems = ndjsonToArray(transactions)
  return (
    rawItems
      // Make sure we only deal with ids that are for our document (including the draft)
      .filter(
        (transaction: Transaction) =>
          transaction.documentIDs &&
          (transaction.documentIDs.includes(documentId) ||
            transaction.documentIDs.includes(`drafts.${documentId}`))
      )
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
    nextEvent.endTime.getTime() - current.endTime.getTime() < EDIT_EVENT_TIME_TRESHHOLD_MS
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

function mutationsToEventType(mutations: Mutation[]) {
  // Created
  if (
    mutations.length === 2 &&
    mutations[0].createIfNotExists &&
    mutations[0].createIfNotExists._id.startsWith('drafts.') &&
    mutations[1].patch.id.startsWith('drafts.')
  ) {
    return 'created'
  }

  // Published
  if (
    mutations.length === 2 &&
    mutations[0].create &&
    mutations[1].delete &&
    mutations[1].delete.id.startsWith('drafts.')
  ) {
    return 'published'
  }
  // Unpublished
  if (
    mutations.length === 2 &&
    mutations[1].createIfNotExists &&
    mutations[1].createIfNotExists._id.startsWith('drafts.') &&
    mutations[0].delete &&
    !mutations[0].delete.id.startsWith('drafts.')
  ) {
    return 'unpublished'
  }

  // Edited
  if (mutations.some(mut => mut.patch)) {
    return 'edited'
  }

  return 'unknown'
}
