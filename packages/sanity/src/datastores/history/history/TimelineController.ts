import type {SanityClient} from '@sanity/client'
import {Diff, ObjectDiff} from '@sanity/diff'
import {Observable} from 'rxjs'
import {Annotation} from '../../../field'
import {RemoteSnapshotVersionEvent} from '../../document/document-pair/checkoutPair'
import {remoteSnapshots} from '../../document/document-pair/remoteSnapshots'
import {Timeline, ParsedTimeRef} from './Timeline'
import {getJsonStream} from './getJsonStream'
import {Chunk} from './types'
import {Aligner} from './Aligner'
import {Reconstruction} from './Reconstruction'

const TRANSLOG_ENTRY_LIMIT = 50

export type TimelineControllerOptions = {
  timeline: Timeline
  client: SanityClient
  documentId: string
  documentType: string
  handler: (err: Error | null, controller: TimelineController) => void
}

/**
 * The controller is responsible for fetching information
 * about a document and maintaining a Timeline.
 */
export class TimelineController {
  timeline: Timeline
  client: SanityClient
  handler: TimelineControllerOptions['handler']

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

  constructor(options: TimelineControllerOptions) {
    this.timeline = options.timeline
    this.client = options.client
    this.handler = options.handler
    this._aligner = new Aligner(this.timeline)

    this.markChange()
  }

  private _aligner: Aligner

  private _fetchMore = false
  private _fetchAtLeast = 0
  private _isRunning = false
  private _didErr = false

  private _since: string | null = null
  private _sinceTime: ParsedTimeRef | null = null
  private _rev: string | null = null
  private _revTime: ParsedTimeRef | null = null

  private _reconstruction?: Reconstruction

  clearRange(): void {
    this.setRange(null, null)
  }

  setRange(since: string | null, rev: string | null): void {
    if (rev !== this._rev) this.setRevTime(rev)
    if (since !== this._since) this.setSinceTime(since)

    let _fetchAtLeast = 10

    if (this._sinceTime === 'loading' || this._revTime === 'loading' || !this._aligner.isAligned) {
      this.selectionState = 'loading'
    } else if (this._sinceTime === 'invalid' || this._revTime === 'invalid') {
      this.selectionState = 'invalid'
    } else if (this._sinceTime) {
      this.selectionState = 'range'

      const targetRev = this._revTime || this.timeline.lastChunk()

      if (this._sinceTime.index > targetRev.index) {
        this._revTime = 'invalid'
        this.selectionState = 'invalid'
      } else {
        this.setReconstruction(this._sinceTime, targetRev)
      }
    } else if (this._revTime) {
      this.selectionState = 'rev'
      this.setReconstruction(null, this._revTime)
    } else {
      this.selectionState = 'inactive'
      _fetchAtLeast = 0
    }

    this._fetchAtLeast = _fetchAtLeast

    this.start()
  }

  setLoadMore(flag: boolean): void {
    this._fetchMore = flag
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
  onOlderRevision(): boolean {
    return Boolean(this._rev) && (this.selectionState === 'range' || this.selectionState === 'rev')
  }

  /** Returns true when the changes panel should be active. */
  changesPanelActive(): boolean {
    return Boolean(this._since) && this.selectionState === 'range'
  }

  findRangeForNewRev(rev: Chunk): [string | null, string | null] {
    const revTimeId = this.timeline.isLatestChunk(rev) ? null : this.timeline.createTimeId(rev)

    if (!this._since) {
      return [null, revTimeId]
    }

    const sinceChunk = this.sinceTime
    if (sinceChunk && sinceChunk.index < rev.index) {
      return [this._since, revTimeId]
    }

    return ['@lastPublished', revTimeId]
  }

  findRangeForNewSince(since: Chunk): [string, string | null] {
    const revChunk = this.revTime

    // If the the `since` timestamp is earlier than the `rev`, then we can
    // accept it. Otherwise we'll move the current revision to the current draft.

    if (revChunk && since.index < revChunk.index) {
      return [this.timeline.createTimeId(since), this._rev]
    }

    return [this.timeline.createTimeId(since), null]
  }

  setRevTime(rev: string | null): void {
    this._rev = rev
    this._revTime = rev ? this.timeline.parseTimeId(rev) : null

    if (this._since === '@lastPublished') {
      // Make sure we invalidate it since this depends on the _rev.
      this._since = null
      this._sinceTime = null
    }
  }

  setSinceTime(since: string | null): void {
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

  sinceAttributes(): Record<string, unknown> | null {
    return this._sinceTime && this._reconstruction ? this._reconstruction.startAttributes() : null
  }

  displayed(): Record<string, unknown> | null {
    return this._revTime && this._reconstruction ? this._reconstruction.endAttributes() : null
  }

  setReconstruction(since: Chunk | null, rev: Chunk): void {
    if (this._reconstruction && this._reconstruction.same(since, rev)) return
    this._reconstruction = new Reconstruction(
      this.timeline,
      this._aligner.currentDocument,
      since,
      rev
    )
  }

  currentDiff(): Diff<Annotation> | null {
    return this._reconstruction ? this._reconstruction.diff() : null
  }

  currentObjectDiff(): ObjectDiff<Annotation> | null {
    const diff = this.currentDiff()
    if (diff) {
      if (diff.type === 'null') return null
      if (diff.type !== 'object') throw new Error(`ObjectDiff expected, got ${diff.type}`)
    }

    return diff as ObjectDiff<Annotation>
  }

  handleRemoteMutation(ev: RemoteSnapshotVersionEvent): void {
    this._aligner.appendRemoteSnapshotEvent(ev)
    this.markChange()

    // Make sure we fetch history as soon as possible.
    if (this._aligner.acceptsHistory) this.start()
  }

  start(): void {
    if (this._didErr) return

    if (!this._isRunning) {
      this._isRunning = true

      this.tick().then(() => {
        this._isRunning = false
      })
    }
  }

  private async tick() {
    const shouldFetchMore =
      this._aligner.acceptsHistory &&
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
    const {dataset, token} = this.client.config()
    const limit = TRANSLOG_ENTRY_LIMIT

    let queryParams = `tag=sanity.studio.desk.history&effectFormat=mendoza&excludeContent=true&excludeMutations=true&includeIdentifiedDocumentsOnly=true&reverse=true&limit=${limit}`
    let tid = this._aligner.earliestTransactionId
    if (tid) {
      queryParams += `&toTransaction=${tid}`
    }

    const url = `/data/history/${dataset}/transactions/${publishedId},${draftId}?${queryParams}`

    const stream = await getJsonStream(this.client.getUrl(url), token)
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

      if (result.value.id === tid) {
        // toTransaction is inclusive so we must ignore it when we fetch the next page
        continue
      }

      // For some reason, the aligner is now interested in a different set of entries.
      // This can happen if a new snapshot comes in as we're streaming the translog.
      // In this case it's safe to abort, and the run-loop will re-schedule it correctly.
      if (this._aligner.earliestTransactionId !== tid || !this._aligner.acceptsHistory) {
        return
      }

      this._aligner.prependHistoryEvent(result.value)
      tid = this._aligner.earliestTransactionId
    }

    // Same consistency checking here:
    if (this._aligner.earliestTransactionId !== tid || !this._aligner.acceptsHistory) {
      return
    }

    if (count < limit) {
      this._aligner.didReachEarliestEntry()
    }

    this.markChange()
  }

  private markChange() {
    this.timeline.updateChunks()

    this.setRevTime(this._rev)
    this.setSinceTime(this._rev)

    this.version++
    this.handler(null, this)
  }
}

export function createObservableController(
  options: Omit<TimelineControllerOptions, 'handler'>
): Observable<{historyController: TimelineController}> {
  return new Observable((observer) => {
    const controller = new TimelineController({
      ...options,
      handler: (err, innerController) => {
        if (err) {
          observer.error(err)
        } else {
          observer.next({historyController: innerController})
        }
      },
    })

    return remoteSnapshots(
      options.client,
      {
        publishedId: options.documentId,
        draftId: `drafts.${options.documentId}`,
      },
      options.documentType
    ).subscribe((ev) => {
      controller.handleRemoteMutation(ev)
    })
  })
}
