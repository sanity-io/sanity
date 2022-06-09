import {BufferedDocument, Mutation} from '@sanity/mutator'
import {SanityDocument} from '@sanity/types'
import {BehaviorSubject, EMPTY, merge, Observable, Subject} from 'rxjs'
import {
  distinctUntilChanged,
  filter,
  map,
  mergeMap,
  mergeMapTo,
  publishReplay,
  refCount,
  scan,
  share,
  take,
  tap,
  withLatestFrom,
} from 'rxjs/operators'
import {ListenerEvent, MutationEvent} from '../getPairListener'
import {
  CommitFunction,
  DocumentMutationEvent,
  DocumentRebaseEvent,
  MutationPayload,
  SnapshotEvent,
  DocumentRemoteMutationEvent,
  RemoteSnapshotEvent,
} from './types'

interface MutationAction {
  type: 'mutation'
  mutations: MutationPayload[]
}

interface CommitAction {
  type: 'commit'
}

type Action = MutationAction | CommitAction

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

const toSnapshotEvent = (document: SanityDocument): SnapshotEvent => ({type: 'snapshot', document})
const getDocument = <T extends {document: any}>(event: T): T['document'] => event.document

// This is an observable interface for BufferedDocument in an attempt
// to make it easier to work with the api provided by it
export const createObservableBufferedDocument = (
  listenerEvent$: Observable<ListenerEvent>,
  commitMutations: CommitFunction
) => {
  // Incoming local actions (e.g. a request to mutate, a request to commit pending changes, etc.)
  const actions$ = new Subject<Action>()

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

  const createInitialBufferedDocument = (initialSnapshot: SanityDocument | null) => {
    const bufferedDocument = new BufferedDocument(initialSnapshot)
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
    ;(bufferedDocument as any).onRemoteMutation = (mutation: any) => {
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
      consistency$.next(isConsistent)
    }

    bufferedDocument.commitHandler = (opts: {
      success: () => void
      failure: () => void
      cancel: (error: Error) => void
      mutation: Mutation
    }) => {
      const {resultRev, ...mutation} = opts.mutation.params
      commitMutations(mutation).then(opts.success, (error) => {
        const isBadRequest =
          error.name === 'ClientError' && error.statusCode >= 400 && error.statusCode <= 500
        if (isBadRequest) {
          opts.cancel(error)
        } else {
          opts.failure()
        }
        return Promise.reject(error)
      })
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
          bufferedDocument.commit()
        }
        return createInitialBufferedDocument(listenerEvent.document || null)
      }
      if (bufferedDocument === null) {
        // eslint-disable-next-line no-console
        console.warn(
          'Ignoring event of type "%s" since buffered document has not yet been set up with snapshot',
          listenerEvent.type
        )
        return null
      }
      return bufferedDocument
    }, null),
    distinctUntilChanged(),
    publishReplay(1),
    refCount()
  )

  // this is a stream of document snapshots where each new snapshot are emitted after listener mutations
  // has been applied. Since the optimistic patches is not emitted on the mutation$ stream, we need this
  // in order to update the document with a new _rev (and _updatedAt)
  const snapshotAfterSync$ = listenerEvent$.pipe(
    filter((ev): ev is MutationEvent => ev.type === 'mutation'),
    withLatestFrom(currentBufferedDocument$),
    map(([mutationEvent, bufferedDocument]) => {
      bufferedDocument!.arrive(new Mutation(mutationEvent))
      return getUpdatedSnapshot(bufferedDocument!)
    })
  )

  // this is where the side effects mandated by local actions actually happens
  const actionHandler$ = actions$.pipe(
    withLatestFrom(currentBufferedDocument$),
    tap(([action, bufferedDocument]) => {
      if (action.type === 'mutation') {
        bufferedDocument!.add(new Mutation({mutations: action.mutations}))
      }
      if (action.type === 'commit') {
        bufferedDocument!.commit()
      }
    }),
    // We subscribe to this only for the side effects
    mergeMapTo(EMPTY),
    share()
  )

  const emitAction = (action: any) => actions$.next(action)

  const addMutations = (mutations: MutationPayload[]) => emitAction({type: 'mutation', mutations})
  const addMutation = (mutation: MutationPayload) => addMutations([mutation])

  const commit = () => {
    return currentBufferedDocument$.pipe(
      take(1),
      mergeMap((bufferedDocument) => bufferedDocument!.commit()),
      mergeMapTo(EMPTY)
    )
  }

  // A stream of this document's snapshot
  const snapshot$ = merge(
    currentBufferedDocument$.pipe(map((bufferedDocument) => bufferedDocument!.LOCAL)),
    mutations$.pipe(map(getDocument)),
    rebase$.pipe(map(getDocument)),
    snapshotAfterSync$
  ).pipe(map(toSnapshotEvent as any), publishReplay(1), refCount())

  const remoteSnapshot$: Observable<RemoteSnapshotEvent> = merge(
    currentBufferedDocument$.pipe(
      map((bufferedDocument) => bufferedDocument!.document.HEAD as any),
      map(toSnapshotEvent)
    ),
    remoteMutations
  ).pipe(publishReplay(1), refCount())

  return {
    updates$: merge(snapshot$, actionHandler$, mutations$, rebase$),
    consistency$: consistency$.pipe(distinctUntilChanged(), publishReplay(1), refCount()),
    remoteSnapshot$,
    addMutation,
    addMutations,
    commit,
  }
}
