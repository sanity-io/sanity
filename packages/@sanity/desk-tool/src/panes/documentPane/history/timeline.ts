/* eslint-disable max-depth, complexity */
import {Diff, NoDiff} from '@sanity/diff'
import {applyPatch, incremental, RawPatch} from 'mendoza'
import {Value} from 'mendoza/lib/incremental-patcher'
import {Transaction, TransactionLogEvent, Chunk, Doc, RemoteMutationWithVersion} from './types'
import {diffValue, Meta} from './mendozaDiffer'
import {TwoEndedArray} from './twoEndedArray'
import {mergeChunk, chunkFromTransaction} from './chunker'

/**
 * TimeRef represents a resolved point in the history. The ID contains both a timestamp and a chunk ID.
 * This means that even if the chunking changes we're able to recover another chunk which is roughly
 * at the same place. If we have a partially loaded history we can use the timestamp to figure out
 * how much history to fetch.
 */
export type TimeRef = {
  id: string
  chunkIdx: number
  chunk: Chunk
}

type Attributes = Record<string, unknown>

type Options = {
  publishedId: string
  draft: Doc | null
  published: Doc | null
}

type DocumentVersion = {
  rev: string
  attributes: Attributes
}

function createVersion(document: Doc | null): DocumentVersion | null {
  if (document) {
    const attributes = {...document} as Attributes
    delete attributes._rev
    if (!document._rev) throw new Error('document must have _rev')
    return {rev: document._rev, attributes}
  }

  return null
}

function patchVersion(
  version: DocumentVersion | null,
  rev: string,
  patch: RawPatch
): DocumentVersion | null {
  const attributes = version ? version.attributes : null
  console.log(attributes, patch)
  const newAttributes = applyPatch(attributes, patch)
  return newAttributes === null ? null : {rev, attributes: newAttributes}
}

/**
 * Timeline maintains information about the history of a document:
 * Grouping raw translog entries into sensible groups, replaying and
 * reconstructing different versions and abstract other details.
 *
 * Note that this class by itself is not capable of _fetching_ information,
 * but will only organize and structure the incoming translog entries.
 */
export class Timeline {
  reachedEarliestEntry = false

  publishedId: string
  draftId: string
  private _transactions = new TwoEndedArray<Transaction>()
  private _chunks = new TwoEndedArray<Chunk>()
  private _draftVersion: DocumentVersion | null
  private _publishedVersion: DocumentVersion | null

  // These two properties are here to handle the case
  private _possiblePendingTransactions = new Map<
    string,
    {
      transaction: Transaction
      idx: number
    }
  >()
  private _recreateTransactionsFrom?: number

  constructor(opts: Options) {
    this.publishedId = opts.publishedId
    this.draftId = `drafts.${opts.publishedId}`
    this._draftVersion = createVersion(opts.draft)
    this._publishedVersion = createVersion(opts.published)
  }

  get chunkCount() {
    return this._chunks.length
  }

  /** Maps over the chunk from newest to oldest. */
  mapChunks<T>(mapper: (chunk: Chunk, idx: number) => T): T[] {
    const result: T[] = []

    const firstIdx = this._chunks.firstIdx
    const lastIdx = this._chunks.lastIdx

    for (let idx = lastIdx; idx >= firstIdx; idx--) {
      result.push(mapper(this._chunks.get(idx), idx))
    }

    return result
  }

  /**
   * Adds a remote mutation to the timeline. This methods assumes that the remote mutations
   * come in correct order for their respective version, but has no ordering requirements
   * across draft/published.
   *
   * Example: [D1, D2, P1] (where D1 and P1 were mutations done to the draft and published
   * version in the same transaction) is a valid input. [P1, D2, D1] is _not_ valid since
   * the mutation for the draft is out of order.
   */
  addRemoteMutation(entry: RemoteMutationWithVersion) {
    const pending = this._possiblePendingTransactions.get(entry.transactionId)

    const transaction: Transaction = pending
      ? pending.transaction
      : {
          id: entry.transactionId,
          timestamp: entry.timestamp,
          author: entry.author
        }

    if (entry.version === 'published') {
      transaction.publishedEffect = entry.effects as any
      this._publishedVersion = patchVersion(
        this._publishedVersion,
        entry.transactionId,
        entry.effects.apply as RawPatch
      )
    } else {
      transaction.draftEffect = entry.effects as any
      this._draftVersion = patchVersion(
        this._draftVersion,
        entry.transactionId,
        entry.effects.apply as RawPatch
      )
    }

    if (pending) {
      this._possiblePendingTransactions.delete(entry.transactionId)
      this._invalidateTransactionFrom(pending.idx)
    } else {
      this._transactions.addToEnd(transaction)
      this._possiblePendingTransactions.set(entry.transactionId, {
        transaction,
        idx: this._transactions.lastIdx
      })
    }
  }

  addTranslogEntry(event: TransactionLogEvent) {
    this._transactions.addToBeginning({
      id: event.id,
      author: event.author,
      timestamp: new Date(event.timestamp),
      draftEffect: event.effects[this.draftId],
      publishedEffect: event.effects[this.publishedId]
    })
  }

  /** Mark that we've reached the earliest entry. */
  didReachEarliestEntry() {
    this.reachedEarliestEntry = true
  }

  /**
   * updateChunks synchronizes the chunks to match the current state
   * of the transactions array. After calling this method you need
   * to invalidate all TimeRefs.
   */
  updateChunks() {
    if (this._recreateTransactionsFrom) {
      while (this._chunks.length > 0) {
        const chunk = this._chunks.last
        if (this._recreateTransactionsFrom < chunk.end) {
          this._chunks.removeFromEnd()
        } else {
          break
        }
      }
      this._recreateTransactionsFrom = undefined
    }

    const firstIdx = this._transactions.firstIdx
    const lastIdx = this._transactions.lastIdx

    // Add transactions at the end:
    const nextTransactionToChunk = this._chunks.length > 0 ? this._chunks.last.end : firstIdx
    for (let idx = nextTransactionToChunk; idx <= lastIdx; idx++) {
      const transaction = this._transactions.get(idx)
      this._chunks.mergeAtEnd(chunkFromTransaction(transaction, idx), mergeChunk)
    }

    // Add transactions at the beginning:
    if (this._chunks.length == 0) return

    const firstTransactionChunked = this._chunks.first.start

    for (let idx = firstTransactionChunked - 1; idx >= firstIdx; idx--) {
      const transaction = this._transactions.get(idx)
      this._chunks.mergeAtBeginning(chunkFromTransaction(transaction, idx), mergeChunk)
    }
  }

  private _invalidateTransactionFrom(idx: number) {
    if (this._recreateTransactionsFrom == null || idx < this._recreateTransactionsFrom) {
      this._recreateTransactionsFrom = idx
    }
  }

  /**
   * Resolves a time reference.
   *
   * Note that the chunk returned is only valid if the timeline stays constant.
   * Once the timeline is updated, you must re-parse all references.
   */
  parseTimeId(id: string): TimeRef | null {
    // TODO: Return ("loadable" | "missing") to distinguish between
    // "might be available in not-yet-loaded-entries" and "completely invalid".

    if (this._chunks.length === 0) return null

    if (id === '-') return this.createTimeRef(this._chunks.lastIdx)

    const [timestampStr, chunkId] = id.split('/', 2)
    const timestamp = Number(timestampStr)

    // TODO: Use the chunkId for something

    const firstIdx = this._chunks.firstIdx
    const lastIdx = this._chunks.lastIdx
    for (let idx = lastIdx; idx >= firstIdx; idx--) {
      const chunk = this._chunks.get(idx)
      if (
        timestamp >= chunk.startTimestamp.valueOf() &&
        timestamp <= chunk.endTimestamp.valueOf()
      ) {
        return this.createTimeRef(idx, chunk)
      }
    }

    return null
  }

  createTimeId(chunkIdx: number, chunk = this._chunks.get(chunkIdx)) {
    return this.createTimeRef(chunkIdx, chunk).id
  }

  /** Creates a time reference from a chunk. */
  private createTimeRef(chunkIdx: number, chunk = this._chunks.get(chunkIdx)): TimeRef {
    const timestamp = Math.round(
      (chunk.startTimestamp.valueOf() + chunk.endTimestamp.valueOf()) / 2
    )

    return {
      id: `${timestamp}/${chunk.id}`,
      chunkIdx,
      chunk
    }
  }

  // We maintain a single "reconstruction" of a range in the history.
  private _reconstruction?: Reconstruction

  /**
   * Sets the range for the current reconstruction.
   *
   * This method optimizes for the cases where `startRef` and/or `endRef` is
   * equal (using object identity) to the previous range, so feel free to call
   * this often rather seldom.
   */
  setRange(startRef: TimeRef, endRef: TimeRef | null) {
    const startIdx = startRef.chunkIdx
    const start = startRef.chunk
    const endIdx = endRef ? endRef.chunkIdx : this._chunks.lastIdx
    const end = endRef ? endRef.chunk : this._chunks.get(endIdx)

    const current = this._reconstruction
    if (current && current.start === start) {
      if (current.end !== end) {
        current.diff = undefined
        current.endDocument = undefined
        current.end = end
        current.endIdx = endIdx
      }

      return
    }

    this._reconstruction = {start, startIdx, end, endIdx}
  }

  /** Returns the attributes as seen at the end of the range. */
  endAttributes() {
    const current = this._reconstruction
    if (!current) {
      throw new Error('range required')
    }

    if (!current.endDocument) {
      this.calculateAttributes(current)
    }

    return getAttrs(current.endDocument!)
  }

  /** Returns the attributes as seen at the end of the range. */
  startAttributes() {
    const current = this._reconstruction
    if (!current) {
      throw new Error('range required')
    }

    if (!current.startDocument) {
      this.calculateAttributes(current)
    }

    return getAttrs(current.startDocument!)
  }

  /** Uses the current draft and the revert patches to construct the start and the end of the range. */
  private calculateAttributes(current: Reconstruction) {
    let draft: any = this._draftVersion ? this._draftVersion.attributes : null
    let published: any = this._publishedVersion ? this._publishedVersion.attributes : null

    const firstIdx = this._transactions.firstIdx
    const lastIdx = this._transactions.lastIdx

    // Iterate backwards over the transactions and apply revert effects.

    for (let idx = lastIdx; idx >= firstIdx; idx--) {
      const transaction = this._transactions.get(idx)

      // The end-index points to the transaction which is _not_
      // included in the chunk. By subtracting 1 we get the transaction
      // which is inside the chunk, and by assigning before the effects
      // are applied we get the state after the chunk.

      if (idx === current.end.end - 1) {
        current.endDocument = {draft, published}
      }

      if (transaction.draftEffect) {
        draft = applyPatch(draft, transaction.draftEffect.revert)
      }

      if (transaction.publishedEffect) {
        published = applyPatch(published, transaction.publishedEffect.revert)
      }

      if (idx === current.start.start) {
        current.startDocument = {draft, published}
        break
      }
    }
  }

  /** Returns the diff between the start and the end range. */
  currentDiff() {
    const current = this._reconstruction
    if (!current) {
      return null
    }

    if (current.diff) {
      return current.diff
    }

    if (!current.startDocument) {
      this.calculateAttributes(current)
    }

    const doc = current.startDocument!

    let draftValue = incremental.wrap<Chunk | null>(doc.draft, null)
    let publishedValue = incremental.wrap<Chunk | null>(doc.published, null)

    const initialValue = getValue(draftValue, publishedValue)
    const initialAttributes = getAttrs(doc)

    let chunk = current.start
    let chunkIdx = current.startIdx

    // Loop over all of the chunks:
    for (;;) {
      for (let idx = chunk.start; idx < chunk.end; idx++) {
        const transaction = this._transactions.get(idx)

        const didHaveDraft = incremental.getType(draftValue) !== 'null'
        const didHavePublished = incremental.getType(publishedValue) !== 'null'

        if (transaction.draftEffect) {
          draftValue = incremental.applyPatch(draftValue, transaction.draftEffect.apply, chunk)

          if (!didHaveDraft) {
            draftValue = incremental.rebaseValue(publishedValue, draftValue)
          }
        }

        if (transaction.publishedEffect) {
          publishedValue = incremental.applyPatch(
            publishedValue,
            transaction.publishedEffect.apply,
            chunk
          )

          if (!didHavePublished) {
            publishedValue = incremental.rebaseValue(draftValue, publishedValue)
          }
        }
      }

      // We reached the final chunk
      if (chunkIdx == current.endIdx) {
        break
      }

      chunkIdx++
      chunk = this._chunks.get(chunkIdx)
    }

    const finalValue = incremental.getType(draftValue) === 'null' ? publishedValue : draftValue
    const finalAttributes = getAttrs(current.endDocument!)
    current.diff = diffValue(initialValue, initialAttributes, finalValue, finalAttributes)
    return current.diff
  }
}

function getAttrs(doc: CombinedDocument) {
  return doc.draft || doc.published
}

function getValue(draftValue: Value<Meta>, publishedValue: Value<Meta>) {
  return incremental.getType(draftValue) === 'null' ? publishedValue : draftValue
}

// The combined document stores information about both the draft and the published version.
type CombinedDocument = {
  draft: Attributes
  published: Attributes
}

type Reconstruction = {
  startIdx: number
  start: Chunk
  endIdx: number
  end: Chunk
  startDocument?: CombinedDocument
  endDocument?: CombinedDocument
  diff?: Diff<any> | NoDiff
}
