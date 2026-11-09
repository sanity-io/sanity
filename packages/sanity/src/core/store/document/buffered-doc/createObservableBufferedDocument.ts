import {BufferedDocument, Mutation} from '@sanity/mutator'
import {type SanityDocument} from '@sanity/types'
import {BehaviorSubject, EMPTY, merge, type Observable, Subject} from 'rxjs'
import {
  distinctUntilChanged,
  filter,
  map,
  mergeMapTo,
  publishReplay,
  refCount,
  scan,
  share,
  take,
  tap,
  withLatestFrom,
} from 'rxjs/operators'

import {errorReporter} from '../../../error/errorReporter'
import {getStatusCode} from '../../../util/apiErrors'
import {type ListenerEvent} from '../getPairListener'
import {type MutationEvent} from '../types'
import {
  type DocumentMutationEvent,
  type DocumentRebaseEvent,
  type DocumentRemoteMutationEvent,
  type MutationPayload,
  type RemoteSnapshotEvent,
  type SnapshotEvent,
} from './types'

interface MutationAction {
  type: 'mutation'
  mutations: MutationPayload[]
}

interface CommitAction {
  type: 'commit'
}

type Action = MutationAction | CommitAction

/**
 * A terminal commit rejection, after the buffered document dropped its unsaved edits and reset to
 * its last confirmed copy.
 *
 * @internal
 */
export interface SaveRejectedEvent {
  error: Error
  /** The local document as it was shown before the reset */
  discardedDocument: SanityDocument | null
  /** The last confirmed copy the document was reset to */
  restoredDocument: SanityDocument | null
}

// A cancel carries an HTTP status and the pair reports it once; anything else is a mutator failure
function reportUnexpectedCommitRejection(error: unknown): void {
  if (typeof getStatusCode(error) === 'number') return
  console.error(error)
  errorReporter.reportError(error instanceof Error ? error : new Error(String(error)), {
    handled: false,
  })
}

/**
 * Represents "commit requests" from the mutator.
 * These are emitted from the BufferedDocument instance's `requestHandler` callback
 *
 * @internal
 */
export interface CommitRequest {
  mutation: Mutation
  success: () => void
  failure: (error: Error) => void
  cancel: (error: Error) => void
  /** Timestamp (Date.now()) when the first local mutation in this commit batch was received */
  firstMutationReceivedAt?: number
  /**
   * The buffered document instance that issued this request, for telemetry.
   * A fresh snapshot replaces the instance while the old one may still be
   * retrying, so this tells the requests of each instance apart.
   */
  owner?: CommitRequestOwner
}

/**
 * Identifies the buffered document instance behind a commit request.
 *
 * @internal
 */
export interface CommitRequestOwner {
  /** False once a fresh snapshot has replaced this buffered document instance */
  isCurrent: () => boolean
}

// BufferedDocument.LOCAL never updates its revision due to its internal consistency checks
// but we sometimes we need the most current _rev on the document in UI land, e.g.
// in order to do optimistic locking on the edited document to make sure we publish the document the user
// actually are looking at, and not the one currently at the server
// Also - the mutator is not setting _updatedAt on patches applied optimistically or
// when they are received from server
const getUpdatedSnapshot = (bufferedDocument: BufferedDocument) => {
  const LOCAL = bufferedDocument.LOCAL
  const HEAD = bufferedDocument.document.HEAD
  if (!LOCAL) {
    return LOCAL
  }

  return {
    ...LOCAL,
    _type: (HEAD || LOCAL)._type,
    _rev: (HEAD || LOCAL)._rev,
    _updatedAt: new Date().toISOString(),
  }
}

/**
 * Whether the mutator holds pending local mutations, read from its public
 * state only:
 * - `buffer.hasChanges()`: mutations not committed yet
 * - `document.pending`: the commit being sent, staged on the inner document
 *   until the server answers (a commit the server accepted moves on to
 *   `submitted` until its echo arrives, and is no longer pending)
 * - `committerRunning`: commits waiting in the mutator's private queue,
 *   including one waiting for a retry with nothing in flight. Queuing a
 *   commit always starts the committer, which only stops once the queue is
 *   empty or a cancel cleared it.
 */
function hasPendingMutations(bufferedDocument: BufferedDocument): boolean {
  return (
    bufferedDocument.buffer.hasChanges() ||
    bufferedDocument.document.pending.length > 0 ||
    bufferedDocument.committerRunning
  )
}

const toSnapshotEvent = (document: any): SnapshotEvent => ({type: 'snapshot', document})
const getDocument = <T extends {document: any}>(event: T): T['document'] => event.document

/** @internal */
// This is an observable interface for BufferedDocument in an attempt
// to make it easier to work with the api provided by it
export const createObservableBufferedDocument = (listenerEvent$: Observable<ListenerEvent>) => {
  // Incoming local actions (e.g. a request to mutate, a request to commit pending changes, etc.)
  const actions$ = new Subject<Action>()

  // Track when the first mutation in a batch arrives (for performance telemetry)
  let firstMutationReceivedAt: number | undefined

  // Stream of commit requests. Must be handled by a commit handler
  const consistency$ = new BehaviorSubject<boolean>(true)

  // Stream of mutations for this document
  // NOTE: this will *not* include remote mutations received over the listener
  // that has *already* applied locally/optimistically
  const mutations$ = new Subject<DocumentMutationEvent>()

  // a stream of rebase events emitted from the mutator
  const rebase$ = new Subject<DocumentRebaseEvent>()

  // a stream of remote mutations with effetcs
  const remoteMutations = new Subject<DocumentRemoteMutationEvent>()

  const commitRequests = new Subject<CommitRequest>()

  const saveRejected = new Subject<SaveRejectedEvent>()

  // Instances a fresh snapshot has replaced. Marked before the consistency
  // flip that the replacement causes, so telemetry reacting to that flip
  // already sees the old instance as replaced.
  const replacedBufferedDocuments = new WeakSet<BufferedDocument>()
  // The instance receiving local mutations, read synchronously for telemetry
  let latestBufferedDocument: BufferedDocument | undefined

  const createInitialBufferedDocument = (initialSnapshot: SanityDocument | null) => {
    const bufferedDocument = new BufferedDocument(initialSnapshot)
    latestBufferedDocument = bufferedDocument
    const owner: CommitRequestOwner = {
      isCurrent: () => !replacedBufferedDocuments.has(bufferedDocument),
    }
    bufferedDocument.onMutation = ({mutation, remote}: any) => {
      // this is called after either when:
      // 1) local mutations has been added, optimistically applied and queued for sending
      // 2) remote mutations originating from another client has arrived and been applied
      mutations$.next({
        type: 'mutation',
        document: getUpdatedSnapshot(bufferedDocument) as any,
        mutations: mutation.mutations,
        origin: remote ? 'remote' : 'local',
      })
    }
    bufferedDocument.onRemoteMutation = (mutation: any) => {
      remoteMutations.next({
        type: 'remoteMutation',
        head: bufferedDocument.document.HEAD as any,
        transactionId: mutation.transactionId,
        timestamp: mutation.timestamp,
        author: mutation.identity,
        effects: mutation.effects,
      })
    }

    bufferedDocument.onRebase = (edge: any, nextRemoteMutations: any, localMutations: any) => {
      rebase$.next({
        type: 'rebase',
        document: edge,
        remoteMutations: nextRemoteMutations,
        localMutations,
      })
    }

    bufferedDocument.onConsistencyChanged = (isConsistent) => {
      if (!isConsistent && firstMutationReceivedAt === undefined) {
        firstMutationReceivedAt = Date.now()
      }
      if (isConsistent) {
        firstMutationReceivedAt = undefined
      }
      consistency$.next(isConsistent)
    }

    bufferedDocument.onCommitsCancelled = (error, discardedLocal) => {
      saveRejected.next({
        error,
        discardedDocument: discardedLocal as SanityDocument | null,
        restoredDocument: bufferedDocument.LOCAL as SanityDocument | null,
      })
    }

    bufferedDocument.commitHandler = (commitArg: CommitRequest) => {
      const captured = firstMutationReceivedAt
      // Reset so the next commit batch doesn't reuse a stale timestamp
      // from a previous batch when the document stays inconsistent
      firstMutationReceivedAt = undefined
      commitRequests.next({...commitArg, firstMutationReceivedAt: captured, owner})
    }

    return bufferedDocument
  }

  const currentBufferedDocument$ = listenerEvent$.pipe(
    scan((bufferedDocument: BufferedDocument | null, listenerEvent) => {
      // consider renaming 'snapshot' to initial/welcome
      if (listenerEvent.type === 'snapshot') {
        if (bufferedDocument) {
          // we received a new snapshot and already got an old one. When we receive a snapshot again
          // it is usually because the connection has been down. Attempt to save pending changes (if any)
          replacedBufferedDocuments.add(bufferedDocument)
          bufferedDocument.commit().catch(reportUnexpectedCommitRejection)
        }
        // mark as consistent when a new snapshot is received
        firstMutationReceivedAt = undefined
        consistency$.next(true)
        return createInitialBufferedDocument(listenerEvent.document || null)
      }
      if (bufferedDocument === null) {
        console.warn(
          'Ignoring event of type "%s" since buffered document has not yet been set up with snapshot',
          listenerEvent.type,
        )
        return null
      }
      return bufferedDocument
    }, null),
    filter(
      <T>(bufferedDocument: T): bufferedDocument is NonNullable<T> => bufferedDocument !== null,
    ),
    distinctUntilChanged(),
    // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
    publishReplay(1),
    // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
    refCount(),
  )

  // this is a stream of document snapshots where each new snapshot are emitted after listener mutations
  // has been applied. Since the optimistic patches is not emitted on the mutation$ stream, we need this
  // in order to update the document with a new _rev (and _updatedAt)
  const snapshotAfterSync$ = listenerEvent$.pipe(
    filter((ev): ev is MutationEvent => ev.type === 'mutation'),
    withLatestFrom(currentBufferedDocument$),
    map(([mutationEvent, bufferedDocument]) => {
      bufferedDocument.arrive(new Mutation(mutationEvent))
      return getUpdatedSnapshot(bufferedDocument)
    }),
  )

  // this is where the side effects mandated by local actions actually happens
  const actionHandler$ = actions$.pipe(
    withLatestFrom(currentBufferedDocument$),
    tap(([action, bufferedDocument]: [Action, BufferedDocument]) => {
      if (action.type === 'mutation') {
        bufferedDocument.add(new Mutation({mutations: action.mutations}))
      }
      if (action.type === 'commit') {
        bufferedDocument.commit().catch(reportUnexpectedCommitRejection)
      }
    }),
    // We subscribe to this only for the side effects
    // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
    mergeMapTo(EMPTY),
    share(),
  )

  const emitAction = (action: any) => actions$.next(action)

  const addMutations = (mutations: MutationPayload[]) => emitAction({type: 'mutation', mutations})
  const addMutation = (mutation: MutationPayload) => addMutations([mutation])

  const commit = () => {
    currentBufferedDocument$
      .pipe(
        take(1),
        tap((bufferedDocument) => bufferedDocument.commit().catch(reportUnexpectedCommitRejection)),
      )
      .subscribe()
  }

  // A stream of this document's snapshot
  const snapshot$ = merge(
    currentBufferedDocument$.pipe(map((bufferedDocument) => bufferedDocument.LOCAL)),
    mutations$.pipe(map(getDocument)),
    rebase$.pipe(map(getDocument)),
    snapshotAfterSync$,
    // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
  ).pipe(map(toSnapshotEvent), publishReplay(1), refCount())

  const remoteSnapshot$: Observable<RemoteSnapshotEvent> = merge(
    currentBufferedDocument$.pipe(
      map((bufferedDocument) => bufferedDocument.document.HEAD as any),
      map(toSnapshotEvent),
    ),
    remoteMutations,
    // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
  ).pipe(publishReplay(1), refCount())

  return {
    updates$: merge(snapshot$, actionHandler$, mutations$, rebase$),
    // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
    consistency$: consistency$.pipe(distinctUntilChanged(), publishReplay(1), refCount()),
    remoteSnapshot$,
    commitRequest$: commitRequests,
    saveRejected$: saveRejected.asObservable(),
    addMutation,
    addMutations,
    commit,
    /** Whether local mutations are pending (telemetry only) */
    hasPendingMutations: () =>
      latestBufferedDocument ? hasPendingMutations(latestBufferedDocument) : false,
  }
}
