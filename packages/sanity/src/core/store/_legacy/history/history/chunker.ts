import {type Chunk} from '../../../../field'
import {getEventFromTransaction} from '../../../events/getDocumentEvents'
import {type EditDocumentVersionEvent} from '../../../events/types'
import {type Transaction} from './types'

const CHUNK_WINDOW = 5 * 60 * 1000 // 5 minutes

function isWithinMergeWindow(a: string, b: string) {
  return Date.parse(b) - Date.parse(a) < CHUNK_WINDOW
}

const mergeEvents = (
  leftEvent: EditDocumentVersionEvent,
  rightEvent: EditDocumentVersionEvent,
): EditDocumentVersionEvent => {
  const mergedEvents = leftEvent.mergedEvents || []
  delete leftEvent.mergedEvents
  return {
    ...rightEvent,
    mergedEvents: [...mergedEvents, leftEvent],
  }
}

/**
 * @internal
 * Decides whether to merge two chunks or not according to their type and timestamp
 */
export function mergeChunk(left: Chunk, right: Chunk): Chunk | [Chunk, Chunk] {
  if (left.end !== right.start) throw new Error('chunks are not next to each other')
  if (
    left.event.type === 'document.editVersion' &&
    right.event.type === 'document.editVersion' &&
    isWithinMergeWindow(left.endTimestamp, right.startTimestamp)
  ) {
    return {
      index: 0,
      id: right.id,
      start: left.start,
      end: right.end,
      event: mergeEvents(left.event, right.event),
      startTimestamp: left.startTimestamp,
      endTimestamp: right.endTimestamp,
    }
  }

  return [left, right]
}

/**
 * @internal
 * Creates a chunk for the timeline from a transaction.
 */
export function chunkFromTransaction(
  publishedId: string,
  transaction: Transaction,
  transactions: Transaction[],
): Chunk {
  const previousTransactions = transactions.filter((tx) => tx.index < transaction.index).reverse()
  return {
    index: 0,
    id: transaction.id,
    start: transaction.index,
    end: transaction.index + 1,
    startTimestamp: transaction.timestamp,
    endTimestamp: transaction.timestamp,
    event: getEventFromTransaction(publishedId, transaction, previousTransactions),
  }
}
