import {BufferedDocument, Mutation} from '@sanity/mutator'
import {defer, merge, NEVER, Observable, Subject, EMPTY} from 'rxjs'
import {
  concatMap,
  distinctUntilChanged,
  map,
  mapTo,
  mergeMapTo,
  publishReplay,
  refCount,
  scan,
  share,
  tap,
  withLatestFrom
} from 'rxjs/operators'
import {
  CommitFunction,
  CommittedEvent,
  DocumentRebaseEvent,
  SnapshotEvent,
  MutationPayload,
  DocumentMutationEvent
} from './types'
import {ListenerEvent} from '../getPairListener'

interface MutationAction {
  type: 'mutation'
  mutations: MutationPayload[]
}

interface CommitAction {
  type: 'commit'
}

type Action = MutationAction | CommitAction

interface CommitRequest {
  mutation: MutationPayload
  onSuccess: () => void
  onError: (error: Error) => void
}

const COMMITTED_EVENT: CommittedEvent = {type: 'committed'}

// This is an observable interface for BufferedDocument in an attempt
// to make it easier to work with the api provided by it
export const createObservableBufferedDocument = (
  listenerEvent$: Observable<ListenerEvent>,
  doCommit: CommitFunction
) => {
  // Incoming local actions (e.g. a request to mutate, a request to commit pending changes, etc.)
  const actions$ = new Subject<Action>()

  // Stream of commit requests. Must be handled by a commit handler
  const commits$ = new Subject<CommitRequest>()

  // Stream of events that has happened with documents (e.g. a mutation that has been applied, a rebase).
  // These are "after the fact" events and also includes the next document state.
  const updates$ = new Subject<DocumentRebaseEvent | DocumentMutationEvent>()

  const createInitialBufferedDocument = snapshot => {
    const bufferedDocument = new BufferedDocument(snapshot)
    bufferedDocument.onMutation = ({mutation, remote}) => {
      updates$.next({
        type: 'mutation',
        document: bufferedDocument.LOCAL,
        mutations: mutation.mutations,
        origin: remote ? 'remote' : 'local'
      })
    }

    bufferedDocument.onRebase = edge => {
      updates$.next({type: 'rebase', document: edge})
    }

    bufferedDocument.commitHandler = opts => {
      const {resultRev, ...mutation} = opts.mutation.params
      commits$.next({onSuccess: opts.success, onError: opts.failure, mutation})
    }
    return bufferedDocument
  }

  const bufferedDocument$ = listenerEvent$.pipe(
    scan((bufferedDocument, listenerEvent): BufferedDocument => {
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
      if (listenerEvent.type === 'mutation') {
        bufferedDocument.arrive(new Mutation(listenerEvent))
      } else if (listenerEvent.type !== 'reconnect') {
        // eslint-disable-next-line no-console
        console.warn('Received unexpected server event of type "%s"', listenerEvent.type)
      }
      return bufferedDocument
    }, null),
    publishReplay(1),
    refCount()
  )

  // this is where the side effects mandated by local actions actually happens
  const actionHandler$ = actions$.pipe(
    withLatestFrom(bufferedDocument$),
    tap(([action, bufferedDocument]) => {
      if (action.type === 'mutation') {
        bufferedDocument.add(new Mutation({mutations: action.mutations}))
      }
      if (action.type === 'commit') {
        bufferedDocument.commit()
      }
    }),
    mergeMapTo(NEVER),
    share()
  )

  const emitAction = action => actions$.next(action)

  const addMutations = (mutations: MutationPayload[]) => emitAction({type: 'mutation', mutations})
  const addMutation = (mutation: MutationPayload) => addMutations([mutation])

  const commit = () =>
    defer(() => {
      emitAction({type: 'commit'})
      return EMPTY
    })

  const snapshot$ = bufferedDocument$.pipe(
    distinctUntilChanged((bufDoc, prevBufDoc) => bufDoc.LOCAL === prevBufDoc.LOCAL),
    map(
      (bufferedDocument): SnapshotEvent => ({
        type: 'snapshot',
        document: bufferedDocument.LOCAL
      })
    )
  )

  const commitResults$ = commits$.pipe(
    concatMap(commitReq =>
      doCommit(commitReq.mutation).pipe(
        tap({
          next: commitReq.onSuccess,
          error: commitReq.onError
        })
      )
    ),
    mapTo(COMMITTED_EVENT)
  )

  return {
    updates$: merge(snapshot$, actionHandler$, updates$, commitResults$),
    addMutation,
    addMutations,
    commit
  }
}
