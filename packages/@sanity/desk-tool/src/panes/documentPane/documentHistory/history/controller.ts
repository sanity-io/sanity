import {Timeline} from './timeline'
import {SanityClient} from '@sanity/client'
import {getJsonStream} from './ndjsonStreamer'
import {Observable, fromEventPattern} from 'rxjs'
import {
  remoteMutations,
  RemoteMutationWithVersion
} from '@sanity/base/lib/datastores/document/document-pair/remoteMutations'

const TRANSLOG_ENTRY_LIMIT = 50

export type Options = {
  timeline: Timeline
  client: SanityClient
  documentId: string
  handler: (err: Error | null, controller: Controller) => void
}

export type UpdateOptions = {
  fetchMore?: boolean
  fetchAtLeast?: number
}

/**
 * The controller is responsible for fetching information
 * about a document and maintaining a Timeline.
 */
export class Controller {
  timeline: Timeline
  client: SanityClient
  handler: Options['handler']
  version: number = 0

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

  update(opts: UpdateOptions) {
    if (this._didErr) return

    if (opts.fetchAtLeast !== undefined) this._fetchAtLeast = opts.fetchAtLeast
    if (opts.fetchMore !== undefined) this._fetchMore = opts.fetchMore

    if (!this._isRunning) {
      this._isRunning = true
      this.tick()
    }
  }

  stop() {
    this._isRunning = false
  }

  handleRemoteMutation(ev: RemoteMutationWithVersion) {
    this.timeline.addRemoteMutation(ev)
    this.timeline.updateChunks() // TODO: A bit async?
    this.markChange()
  }

  private async tick() {
    if (!this._isRunning) return

    let shouldFetchMore =
      !this.timeline.reachedEarliestEntry &&
      (this._fetchMore || this.timeline.chunkCount <= this._fetchAtLeast)

    if (!shouldFetchMore) {
      this._isRunning = false
      return
    }

    try {
      await this.fetchMoreTransactions()
    } catch (err) {
      this._didErr = true
      this._isRunning = false
      this.handler(err, this)
      return
    }

    this.tick()
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

    while (true) {
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
    this.version++
    this.handler(null, this)
  }
}

export function createObservableController(
  options: Omit<Options, 'handler'>
): Observable<Controller> {
  return new Observable(observer => {
    const controller = new Controller({
      ...options,
      handler: (err, innerController) => {
        if (err) {
          observer.error(err)
        } else {
          observer.next(innerController)
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
