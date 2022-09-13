import type {SanityDocument, TransactionLogEventWithEffects} from '@sanity/types'
import {applyPatch} from 'mendoza'
import {RemoteSnapshotVersionEvent} from '../../document/document-pair/checkoutPair'
import {Timeline} from './Timeline'
import type {DocumentRemoteMutationVersionEvent, CombinedDocument} from './types'

type VersionState = {
  id: string
  hasAttrs: boolean
  attrs: Record<string, unknown> | null
  rev: string | null
  events: Array<DocumentRemoteMutationVersionEvent>
  aligned: boolean
}

function emptyVersionState(id: string): VersionState {
  return {
    id,
    hasAttrs: false,
    attrs: null,
    rev: null,
    events: [],
    aligned: false,
  }
}

function align(history: TransactionLogEventWithEffects, state: VersionState): number {
  const idx = state.events.findIndex((evt) => history.id === evt.transactionId)
  if (idx >= 0) {
    // Return the next event as we don't want this to be included.
    return idx + 1
  }

  if (state.rev) {
    return state.rev === history.id ? 0 : -1
  }

  // At this point the document doesn't exist and we were not able to match
  // it up with a received mutation. This is a bit unfortunate as we don't
  // have a _reliably_ way of aligning it. For now we just always assume
  // that it's consistent.

  return 0
}

function startFromSnapshot(state: VersionState, doc: SanityDocument) {
  state.hasAttrs = true

  if (doc) {
    state.attrs = {...doc}
    if (typeof state.attrs._rev != 'string') throw new Error('snapshot has no _rev')
    state.rev = state.attrs._rev
    delete state.attrs._rev
  } else {
    state.attrs = null
    state.rev = null
  }

  state.events = []
}

/**
 * The timeline consists of data from (1) the history, (2) live draft mutations, and
 * (3) live published mutations. It's critical for us that the chain of transactions
 * is complete and without holes. The following class can be used as a layer in front
 * of Timeline to ensure this:
 *
 * - Invoke `appendRemoteSnapshotEvent` when there's an incoming remote mutation.
 *   These mutations are buffered internally and _not_ passed to the timeline quite yet.
 *
 * - Once we've received snapshots for both draft and published, then `acceptsHistory`
 *   becomes true and the caller can fetch a chunk of the translog. The flag
 *   `earliestTransactionId` can be used to figure out where to fetch transactions from.
 *
 * - The caller invokes `prependHistoryEvent` for each of the events. These history events
 *   are always pushed to the timeline and it will become available immediately.
 *
 * - Internally this class will then try to align the history event to the received
 *   mutations and then dispatch to the timeline.
 *
 * - The aligner also maintains the latest version for both the draft and the published version.
 *
 *
 */
export class Aligner {
  timeline: Timeline
  earliestTransactionId: string | null = null

  constructor(timeline: Timeline) {
    this.timeline = timeline
    this._states = {
      draft: emptyVersionState(timeline.draftId),
      published: emptyVersionState(timeline.publishedId),
    }
  }

  private _states: {
    draft: VersionState
    published: VersionState
  }

  appendRemoteSnapshotEvent(evt: RemoteSnapshotVersionEvent): void {
    const state = this._states[evt.version]

    if (evt.type === 'snapshot') {
      this._maybeInvalidateHistory()

      startFromSnapshot(state, evt.document)
      return
    }

    if (evt.type === 'remoteMutation') {
      if (state.aligned) {
        this._apply(state, evt)
        this.timeline.addRemoteMutation(evt)
      } else if (state.hasAttrs) {
        state.events.push(evt)
      } else {
        startFromSnapshot(state, evt.head)
      }
    }
  }

  prependHistoryEvent(evt: TransactionLogEventWithEffects): void {
    if (!this.acceptsHistory) throw new Error('cannot prepend history at this point')

    for (const state of Object.values(this._states)) {
      if (!state.aligned) {
        const idx = align(evt, state)

        if (idx >= 0) {
          this._alignAtIndex(state, idx)
        }
      }
    }

    this.timeline.addTranslogEntry(evt)
    this.earliestTransactionId = evt.id
  }

  didReachEarliestEntry(): void {
    for (const state of Object.values(this._states)) {
      if (!state.aligned) {
        if (state.attrs !== null) throw new Error('unable to find translog entry to align to')
        this._alignAtIndex(state, 0)
      }
    }
    this.timeline.didReachEarliestEntry()
  }

  get isAligned(): boolean {
    return Object.values(this._states).every((state) => state.aligned)
  }

  get acceptsHistory(): boolean {
    return this._isComplete
  }

  get currentDocument(): CombinedDocument {
    return {draft: this._states.draft.attrs, published: this._states.published.attrs}
  }

  private _alignAtIndex(state: VersionState, idx: number) {
    // These we must only apply locally since they are present in the fetched translog.
    for (const mutEvt of state.events.slice(0, idx)) {
      this._apply(state, mutEvt)
    }

    // ... while these must also be pushed to the timeline:
    for (const mutEvt of state.events.slice(idx)) {
      this._apply(state, mutEvt)
      this.timeline.addRemoteMutation(mutEvt)
    }

    state.events = []
    state.aligned = true
  }

  private get _isComplete(): boolean {
    return Object.values(this._states).every((state) => state.hasAttrs)
  }

  // eslint-disable-next-line class-methods-use-this
  private _apply(state: VersionState, evt: DocumentRemoteMutationVersionEvent) {
    state.attrs = applyPatch(state.attrs, evt.effects.apply as any)
    state.rev = evt.transactionId
  }

  private _maybeInvalidateHistory() {
    if (this._isComplete) {
      for (const state of Object.values(this._states)) {
        state.aligned = false
      }
      this.earliestTransactionId = null
      this.timeline.reset()
    }
  }
}
