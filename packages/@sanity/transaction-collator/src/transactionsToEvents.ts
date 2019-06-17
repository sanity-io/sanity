import {isEqual, uniq} from 'lodash'
import {HistoryEvent, Transaction, Mutation} from './types'
import {ndjsonToArray} from './utils/ndjsonToArray'

const EDIT_EVENT_TIME_TRESHHOLD_MS = 5 * 1000 * 60 * 5 // 5 minutes
export function transactionsToEvents(
  documentIds: string[],
  transactions: string | Buffer | Transaction[]
): HistoryEvent[] {
  const rawItems = Array.isArray(transactions) ? transactions : ndjsonToArray(transactions)
  return (
    rawItems
      // Make sure we only deal with transactions that are relevant for our documents
      .filter(
        (transaction: Transaction) =>
          transaction.documentIDs && transaction.documentIDs.some(id => documentIds.includes(id))
      )
      // ensure transactions are sorted by time
      .sort(compareTimestamp)
      // Turn a transaction into a classified HistoryEvent
      .map((transaction, index) => {
        return mapToEvents(transaction, documentIds, index)
      })
      // Chunk and group edit events
      .reduce(reduceEdits, [])
  )
}

function findDisplayDocumentId(type: string, documentIds: string[]): string | undefined {
  const ids = documentIds.filter(Boolean)
  const publishedId = ids.find(id => !id.startsWith('drafts.'))
  const draftId = ids.find(id => id.startsWith('drafts.')) || `drafts.${publishedId}`
  switch (type) {
    case 'created':
      return draftId
    case 'edited':
      return draftId
    case 'published':
      return publishedId
    case 'unpublished':
      return draftId
    case 'discardDraft':
      return publishedId
    default:
      return undefined
  }
}

function mapToEvents(
  transaction: Transaction,
  documentIds: string[],
  index: number = 0
): HistoryEvent {
  const type = mutationsToEventType(transaction.mutations, index)
  const displayDocumentId = findDisplayDocumentId(type, documentIds)
  const timestamp = new Date(transaction.timestamp)
  return {
    type,
    documentIDs: transaction.documentIDs,
    displayDocumentId,
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

export function mutationsToEventType(mutations: Mutation[], transactionIndex: number) {
  const withoutPatches = mutations.filter(mut => mut.patch === undefined)

  // Created
  if (
    transactionIndex === 0 &&
    ((mutations[0].createIfNotExists && mutations[0].createIfNotExists.id.startsWith('drafts.')) ||
      (mutations[0].create && mutations[0].create.id.startsWith('drafts.')))
  ) {
    return 'created'
  }

  // Published
  if (
    withoutPatches.length === 2 &&
    (withoutPatches.some(mut => mut.delete) || withoutPatches.some(mut => mut.createOrReplace)) &&
    withoutPatches.some(mut => mut.delete && mut.delete.id.startsWith('drafts.'))
  ) {
    return 'published'
  }

  // Unpublished
  if (
    withoutPatches.length === 2 &&
    withoutPatches.some(
      mut =>
        (mut.createIfNotExists && mut.createIfNotExists.id.startsWith('drafts.')) ||
        (mut.create && mut.create.id.startsWith('drafts.'))
    ) &&
    withoutPatches.some(mut => mut.delete && !mut.delete.id.startsWith('drafts.'))
  ) {
    return 'unpublished'
  }

  // Restored to previous version (return edited for now)
  if (
    mutations.length === 1 &&
    ((mutations[0].createOrReplace && mutations[0].createOrReplace.id.startsWith('drafts.')) ||
      (mutations[0].create && mutations[0].create.id.startsWith('drafts.')) ||
      (mutations[0].createIfNotExists && mutations[0].createIfNotExists.id.startsWith('drafts.')))
  ) {
    return 'edited'
  }

  // Discard drafted changes
  if (
    mutations.length === 1 &&
    mutations[0].delete &&
    mutations[0].delete.id.startsWith('drafts.')
  ) {
    return 'discardDraft'
  }

  if (mutations.length === 1 && mutations[0].createSquashed) {
    return 'truncated'
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
