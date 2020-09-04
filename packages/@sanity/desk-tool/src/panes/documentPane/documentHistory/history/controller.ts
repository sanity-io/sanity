/* eslint-disable complexity */
import {SanityClient} from '@sanity/client'
import {Observable} from 'rxjs'
import {
  remoteMutations,
  RemoteMutationWithVersion
} from '@sanity/base/lib/datastores/document/document-pair/remoteMutations'
import {Chunk} from '@sanity/field/diff'
import {Timeline, ParsedTimeRef} from './timeline'
import {getJsonStream} from './ndjsonStreamer'

const TRANSLOG_ENTRY_LIMIT = 50

export type Options = {
  timeline: Timeline
  client: SanityClient
  documentId: string
  handler: (err: Error | null, controller: Controller) => void
}

/**
 * The controller is responsible for fetching information
 * about a document and maintaining a Timeline.
 */
export class Controller {
  timeline: Timeline
  client: SanityClient
  handler: Options['handler']

  version = 0

  /**
   * The selection state represents the  different states of the current selection:
   * - inactive: No selection is active.
   * - rev: A selection is active for a single revision.
   * - range: A selection is active for a range and we have all the data needed to render it.
   * - loading: A selection is active, but we don't have the entries yet.
   * - invalid: The selection picked is invalid.
   */
  selectionState: 'inactive' | 'rev' | 'range' | 'loading' | 'invalid' = 'inactive'

  constructor(options: Options) {
    this.timeline = options.timeline
    this.client = options.client
    this.handler = options.handler
    this.markChange()
  }

  private _fetchMore = false
  private _fetchAtLeast = 0
  private _earliestTransactionId?: string
  private _isRunning = false
  private _didErr = false

  private _since: string | null = null
  private _sinceTime: ParsedTimeRef | null = null
  private _rev: string | null = null
  private _revTime: ParsedTimeRef | null = null

  clearRange() {
    this.setRange(null, null)
  }

  setRange(since: string | null, rev: string | null) {
    if (rev !== this._rev) this.setRevTime(rev)
    if (since !== this._since) this.setSinceTime(since)

    let _fetchAtLeast = 10

    if (this._sinceTime === 'loading' || this._revTime === 'loading') {
      this.selectionState = 'loading'
    } else if (this._sinceTime === 'invalid' || this._revTime === 'invalid') {
      this.selectionState = 'invalid'
    } else if (this._sinceTime) {
      this.selectionState = 'range'

      const rev = this._revTime || this.timeline.lastChunk()

      if (this._sinceTime.index > rev.index) {
        this._revTime = 'invalid'
        this.selectionState = 'invalid'
      } else {
        this.timeline.setRange(this._sinceTime, rev)
      }
    } else if (this._revTime) {
      this.selectionState = 'rev'
      this.timeline.setRange(null, this._revTime)
    } else {
      this.selectionState = 'inactive'
      _fetchAtLeast = 0
    }

    this._fetchAtLeast = _fetchAtLeast

    this.start()
  }

  setLoadMore(state: boolean) {
    this._fetchMore = state
    this.start()
  }

  get sinceTime(): Chunk | null {
    return this._sinceTime && typeof this._sinceTime === 'object' ? this._sinceTime : null
  }

  get revTime(): Chunk | null {
    return this._revTime && typeof this._revTime === 'object' ? this._revTime : null
  }

  get realRevChunk(): Chunk {
    return this.revTime || this.timeline.lastChunk()
  }

  /** Returns true when there's an older revision we want to render. */
  onOlderRevision() {
    return Boolean(this._rev) && (this.selectionState === 'range' || this.selectionState === 'rev')
  }

  /** Returns true when the changes panel should be active. */
  changesPanelActive() {
    return Boolean(this._since) && this.selectionState !== 'invalid'
  }

  findRangeForNewRev(rev: Chunk): [string | null, string | null] {
    const revTimeId = this.timeline.isLatestChunk(rev) ? null : this.timeline.createTimeId(rev)

    if (this._since) {
      const sinceChunk = this.sinceTime
      if (sinceChunk && sinceChunk.index < rev.index) {
        return [this._since, revTimeId]
      } else {
        return ['@lastPublished', revTimeId]
      }
    } else {
      return [null, revTimeId]
    }
  }

  findRangeForNewSince(since: Chunk): [string, string | null] {
    const revChunk = this.revTime

    // If the the `since` timestamp is earlier than the `rev`, then we can
    // accept it. Otherwise we'll move the current revision to the current draft.

    if (revChunk && since.index < revChunk.index) {
      return [this.timeline.createTimeId(since), this._rev]
    } else {
      return [this.timeline.createTimeId(since), null]
    }
  }

  setRevTime(rev: string | null) {
    this._rev = rev
    this._revTime = rev ? this.timeline.parseTimeId(rev) : null

    if (this._since === '@lastPublished') {
      // Make sure we invalidate it since this depends on the _rev.
      this._since = null
      this._sinceTime = null
    }
  }

  setSinceTime(since: string | null) {
    if (since === '@lastPublished') {
      if (typeof this._revTime === 'string') {
        this._sinceTime = this._revTime
      } else {
        this._sinceTime = this.timeline.findLastPublishedBefore(this._revTime)
      }
    } else {
      this._sinceTime = since ? this.timeline.parseTimeId(since) : null
    }

    this._since = since
  }

  displayed() {
    return this._revTime ? this.timeline.endAttributes() : null
  }

  start() {
    if (this._didErr) return

    if (!this._isRunning) {
      this._isRunning = true
      this.tick().then(() => {
        this._isRunning = false
      })
    }
  }

  handleRemoteMutation(ev: RemoteMutationWithVersion) {
    this.timeline.addRemoteMutation(ev)
    this.timeline.updateChunks() // TODO: A bit async?
    this.markChange()
  }

  private async tick() {
    const shouldFetchMore =
      !this.timeline.reachedEarliestEntry &&
      (this.selectionState === 'loading' ||
        this._fetchMore ||
        this.timeline.chunkCount <= this._fetchAtLeast)

    if (!shouldFetchMore) {
      return
    }

    try {
      await this.fetchMoreTransactions()
    } catch (err) {
      this._didErr = true
      this.handler(err, this)
      return
    }

    await this.tick()
  }

  private async fetchMoreTransactions() {
    const publishedId = this.timeline.publishedId
    const draftId = this.timeline.draftId
    const dataset = this.client.config().dataset
    const limit = TRANSLOG_ENTRY_LIMIT

    let queryParams = `effectFormat=mendoza&excludeContent=true&excludeMutations=true&includeIdentifiedDocumentsOnly=true&reverse=true&limit=${limit}`
    if (this._earliestTransactionId) {
      queryParams += `&toTransaction=${this._earliestTransactionId}`
    }

    const url = `/data/history/${dataset}/transactions/${publishedId},${draftId}?${queryParams}`

    const stream = await getJsonStream(this.client.getUrl(url))
    const reader = stream.getReader()
    let count = 0

    for (;;) {
      // eslint-disable-next-line no-await-in-loop
      const result = await reader.read()
      if (result.done) break

      if ('error' in result.value) {
        throw new Error(result.value.error.description || result.value.error.type)
      }

      count++

      if (result.value.id === this._earliestTransactionId) {
        // toTransaction is inclusive so we must ignore it when we fetch the next page
        continue
      }

      this.timeline.addTranslogEntry(result.value)
      this._earliestTransactionId = result.value.id
    }

    if (count < limit) {
      this.timeline.didReachEarliestEntry()
    }

    this.timeline.updateChunks()
    this.markChange()
  }

  private markChange() {
    this.setRevTime(this._rev)
    this.setSinceTime(this._rev)

    this.version++
    this.handler(null, this)
  }
}

export function createObservableController(
  options: Omit<Options, 'handler'>
): Observable<{historyController: Controller}> {
  return new Observable(observer => {
    const controller = new Controller({
      ...options,
      handler: (err, innerController) => {
        if (err) {
          observer.error(err)
        } else {
          observer.next({historyController: innerController})
        }
      }
    })
    return remoteMutations({
      publishedId: options.documentId,
      draftId: `drafts.${options.documentId}`
    }).subscribe(ev => {
      controller.handleRemoteMutation(ev)
    })
  })
}
