import type {TransactionLogEventWithEffects} from '@sanity/types'
import {Diff} from '@sanity/diff'
import {applyPatch, incremental} from 'mendoza'
import {Chunk, Annotation} from '../../../../field'
import {Transaction, DocumentRemoteMutationVersionEvent, CombinedDocument} from './types'
import {diffValue, Meta} from './diffValue'
import {TwoEndedArray} from './TwoEndedArray'
import {mergeChunk, chunkFromTransaction} from './chunker'
import {TraceEvent} from './replay'
import {getAttrs} from './utils'

/** @beta */
export type ParsedTimeRef = Chunk | 'loading' | 'invalid'

/** @beta */
export interface TimelineOptions {
  publishedId: string
  enableTrace?: boolean
}

/**
 * Timeline maintains information about the history of a document:
 * Grouping raw translog entries into sensible groups, replaying and
 * reconstructing different versions and abstract other details.
 *
 * Note that this class by itself is not capable of _fetching_ information,
 * but will only organize and structure the incoming translog entries.
 *
 * @beta
 */
export class Timeline {
  reachedEarliestEntry = false

  publishedId: string
  draftId: string
  private _transactions = new TwoEndedArray<Transaction>()
  private _chunks = new TwoEndedArray<Chunk>()

  // These two properties are here to handle the case
  private _possiblePendingTransactions = new Map<
    string,
    {
      transaction: Transaction
      idx: number
    }
  >()
  private _recreateTransactionsFrom?: number
  private _trace?: TraceEvent[]

  constructor(opts: TimelineOptions) {
    this.publishedId = opts.publishedId
    this.draftId = `drafts.${opts.publishedId}`

    if (opts.enableTrace) {
      this._trace = []
      this._trace.push({
        type: 'initial',
        publishedId: opts.publishedId,
      })
      ;(window as any).__sanityTimelineTrace = this._trace
    }
  }

  get chunkCount(): number {
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

  reset(): void {
    this._transactions = new TwoEndedArray()
    this._chunks = new TwoEndedArray()
    this._possiblePendingTransactions = new Map()
    this._recreateTransactionsFrom = undefined
    this.reachedEarliestEntry = false
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
  addRemoteMutation(entry: DocumentRemoteMutationVersionEvent): void {
    if (this._trace) this._trace.push({type: 'addRemoteMutation', event: entry})

    const pending = this._possiblePendingTransactions.get(entry.transactionId)

    const transaction: Transaction = pending
      ? pending.transaction
      : {
          index: 0,
          id: entry.transactionId,
          timestamp: entry.timestamp.toISOString(),
          author: entry.author,
        }

    if (entry.version === 'draft') {
      transaction.draftEffect = entry.effects as any
    } else {
      transaction.publishedEffect = entry.effects as any
    }

    if (pending) {
      this._possiblePendingTransactions.delete(entry.transactionId)
      this._invalidateTransactionFrom(pending.idx)
    } else {
      this._transactions.addToEnd(transaction)
      this._possiblePendingTransactions.set(entry.transactionId, {
        transaction,
        idx: this._transactions.lastIdx,
      })
    }
  }

  addTranslogEntry(event: TransactionLogEventWithEffects): void {
    if (this._trace) this._trace.push({type: 'addTranslogEntry', event})

    this._transactions.addToBeginning({
      index: 0,
      id: event.id,
      author: event.author,
      timestamp: event.timestamp,
      draftEffect: event.effects[this.draftId],
      publishedEffect: event.effects[this.publishedId],
    })
  }

  /** Mark that we've reached the earliest entry. */
  didReachEarliestEntry(): void {
    if (this._trace) this._trace.push({type: 'didReachEarliestEntry'})

    this.reachedEarliestEntry = true
  }

  /**
   * updateChunks synchronizes the chunks to match the current state
   * of the transactions array. After calling this method you need
   * to invalidate all Chunks.
   */
  updateChunks(): void {
    if (this._trace) this._trace.push({type: 'updateChunks'})

    this._removeInvalidatedChunks()
    this._addChunksFromTransactions()
    this._createInitialChunk()
  }

  private _removeInvalidatedChunks() {
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
  }

  private _addChunksFromTransactions() {
    const firstIdx = this._transactions.firstIdx
    const lastIdx = this._transactions.lastIdx

    // Add transactions at the end:
    const nextTransactionToChunk = this._chunks.length > 0 ? this._chunks.last.end : firstIdx
    for (let idx = nextTransactionToChunk; idx <= lastIdx; idx++) {
      const transaction = this._transactions.get(idx)
      this._chunks.mergeAtEnd(chunkFromTransaction(transaction), mergeChunk)
    }

    // Add transactions at the beginning:
    if (this._chunks.length == 0) return

    const firstTransactionChunked = this._chunks.first.start

    for (let idx = firstTransactionChunked - 1; idx >= firstIdx; idx--) {
      const transaction = this._transactions.get(idx)
      this._chunks.mergeAtBeginning(chunkFromTransaction(transaction), mergeChunk)
    }
  }

  private _invalidateTransactionFrom(idx: number) {
    if (this._recreateTransactionsFrom === undefined || idx < this._recreateTransactionsFrom) {
      this._recreateTransactionsFrom = idx
    }
  }

  private _createInitialChunk() {
    if (this.reachedEarliestEntry) {
      if (this._chunks.first?.type === 'initial') return

      const firstTx = this._transactions.first
      if (!firstTx) return
      const initialChunk = chunkFromTransaction(firstTx)
      initialChunk.type = 'initial'
      initialChunk.id = '@initial'
      initialChunk.end = initialChunk.start
      this._chunks.addToBeginning(initialChunk)
    }
  }

  /**
   * Resolves a time reference.
   *
   * Note that the chunk returned is only valid if the timeline stays constant.
   * Once the timeline is updated, you must re-parse all references.
   */
  parseTimeId(id: string): ParsedTimeRef {
    if (this._chunks.length === 0) {
      return this.reachedEarliestEntry ? 'invalid' : 'loading'
    }

    // NOTE:
    // This was refactored from
    // ```
    // const [timestampStr, chunkId] = id.split('/', 3)
    // ```
    // in order to avoid issues with `@microsoft/api-extractor`.
    const idSegments = id.split('/', 3)
    const timestampStr = idSegments.shift()
    const chunkId = idSegments.shift()
    const timestamp = Number(timestampStr)

    for (let idx = this._chunks.lastIdx; idx >= this._chunks.firstIdx; idx--) {
      const chunk = this._chunks.get(idx)
      if (chunk.id === chunkId) {
        return chunk
      }

      if (Date.parse(chunk.endTimestamp) + 60 * 60 * 1000 < timestamp) {
        // The chunk ended _before_ the timestamp we're asking for. This means that there
        // is no point in looking further and the chunk is invalid.

        // We add 1 hour to allow some slack since transactions are not guaranteed to be in order.
        return 'invalid'
      }
    }

    return this.reachedEarliestEntry ? 'invalid' : 'loading'
  }

  findLastPublishedBefore(chunk: Chunk | null): ParsedTimeRef {
    for (
      let chunkIdx = chunk ? chunk.index - 1 : this._chunks.lastIdx;
      chunkIdx >= this._chunks.firstIdx;
      chunkIdx--
    ) {
      const currentChunk = this._chunks.get(chunkIdx)
      if (currentChunk.type === 'publish' || currentChunk.type === 'initial') {
        return currentChunk
      }
    }

    if (!this.reachedEarliestEntry) return 'loading'

    return this._chunks.first
  }

  isLatestChunk(chunk: Chunk): boolean {
    return chunk === this._chunks.last
  }

  // eslint-disable-next-line class-methods-use-this
  createTimeId(chunk: Chunk): string {
    return `${chunk.endTimestamp.valueOf()}/${chunk.id}`
  }

  lastChunk(): Chunk {
    return this._chunks.last
  }

  transactionByIndex(idx: number): Transaction | null {
    if (!this._transactions.has(idx)) return null
    return this._transactions.get(idx)
  }

  chunkByTransactionIndex(idx: number, startChunkIdx = 0): Chunk {
    let chunkIdx = startChunkIdx
    for (;;) {
      const chunk = this._chunks.get(chunkIdx)
      if (!chunk) throw new Error('transaction does not belong in any chunk')

      if (idx >= chunk.end) {
        chunkIdx++
      } else if (idx < chunk.start) {
        chunkIdx--
      } else {
        return chunk
      }
    }
  }

  replayBackwardsBetween(
    firstIdx: number,
    lastIdx: number,
    doc: CombinedDocument
  ): CombinedDocument {
    let draft = doc.draft
    let published = doc.published

    for (let idx = lastIdx; idx >= firstIdx; idx--) {
      const transaction = this._transactions.get(idx)

      if (transaction.draftEffect) {
        draft = applyPatch(draft, transaction.draftEffect.revert)
      }

      if (transaction.publishedEffect) {
        published = applyPatch(published, transaction.publishedEffect.revert)
      }
    }

    return {draft, published}
  }

  replayBackwardsUntil(firstIdx: number, doc: CombinedDocument): CombinedDocument {
    return this.replayBackwardsBetween(firstIdx, this._transactions.lastIdx, doc)
  }

  calculateDiff(
    initialDoc: CombinedDocument,
    finalDoc: CombinedDocument,
    firstIdx: number,
    lastIdx: number
  ): Diff<Annotation> {
    let draftValue = incremental.wrap<Meta>(initialDoc.draft, null)
    let publishedValue = incremental.wrap<Meta>(initialDoc.published, null)

    const initialValue = getValue(draftValue, publishedValue)
    const initialAttributes = getAttrs(initialDoc)
    let firstChunk: Chunk | null = null

    // Loop over all of the chunks:
    for (let chunkIdx = firstIdx; chunkIdx <= lastIdx; chunkIdx++) {
      const chunk = this._chunks.get(chunkIdx)
      if (!firstChunk) firstChunk = chunk

      for (let idx = chunk.start; idx < chunk.end; idx++) {
        const transaction = this._transactions.get(idx)

        const meta = {
          chunk,
          transactionIndex: idx,
        }

        const preDraftValue = draftValue
        const prePublishedValue = publishedValue

        if (transaction.draftEffect) {
          draftValue = incremental.applyPatch(draftValue, transaction.draftEffect.apply, meta)
        }

        if (transaction.publishedEffect) {
          publishedValue = incremental.applyPatch(
            publishedValue,
            transaction.publishedEffect.apply,
            meta
          )
        }

        const didHaveDriaft = incremental.getType(preDraftValue) !== 'null'
        const haveDraft = incremental.getType(draftValue) !== 'null'
        const havePublished = incremental.getType(publishedValue) !== 'null'

        if (havePublished && !haveDraft) {
          publishedValue = incremental.rebaseValue(preDraftValue, publishedValue)
        }

        if (haveDraft && !didHaveDriaft) {
          draftValue = incremental.rebaseValue(prePublishedValue, draftValue)
        }
      }
    }

    const finalValue = incremental.getType(draftValue) === 'null' ? publishedValue : draftValue
    const finalAttributes = getAttrs(finalDoc)

    return diffValue(this, firstChunk, initialValue, initialAttributes, finalValue, finalAttributes)
  }
}

function getValue(draftValue: incremental.Value<Meta>, publishedValue: incremental.Value<Meta>) {
  return incremental.getType(draftValue) === 'null' ? publishedValue : draftValue
}
