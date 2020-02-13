import {BufferedDocument, Mutation} from '@sanity/mutator'
import {defer, merge, of, Subject} from 'rxjs'
import {
  distinctUntilChanged,
  filter,
  map,
  publishReplay,
  refCount,
  scan,
  mapTo,
  concatMap,
  share,
  tap,
  withLatestFrom
} from 'rxjs/operators'

export const snapshotEventFrom = snapshot => ({
  type: 'snapshot',
  document: snapshot
})

// This is an observable interface for BufferedDocument in an attempt
// to make it easier to work with the api provided by it
export const createObservableBufferedDocument = (serverEvents$, doCommit) => {
  // Incoming local actions (e.g. a request to mutate, a request to commit pending changes, etc.)
  const actions$ = new Subject()

  // Stream of events that has happened with documents (e.g. a mutation that has been applied, a rebase).
  // These are "after the fact" events and also includes the next document state.
  const updates$ = new Subject()

  // Stream of commit requests. Must be handled by a commit handler
  const commits$ = new Subject()

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
      commits$.next({onSuccess: opts.success, onError: opts.failure, payload: mutation})
    }
    return bufferedDocument
  }

  const bufferedDocument$ = serverEvents$.pipe(
    scan((bufferedDocument, serverEvent) => {
      if (serverEvent.type === 'snapshot') {
        if (bufferedDocument) {
          // we received a new snapshot and already got an old one. When we receive a snapshot again
          // it is usually because the connection has been down. Attempt to save pending changes (if any)
          bufferedDocument.commit()
        }
        return createInitialBufferedDocument(serverEvent.document || null)
      }
      if (!bufferedDocument) {
        // eslint-disable-next-line no-console
        console.warn(
          'Ignoring event of type "%s" since buffered document has not yet been set up with snapshot',
          serverEvent.type
        )
        return bufferedDocument
      }
      if (serverEvent.type === 'mutation') {
        bufferedDocument.arrive(new Mutation(serverEvent))
      } else if (serverEvent.type !== 'reconnect') {
        // eslint-disable-next-line no-console
        console.warn('Received unexpected server event of type "%s"', serverEvent.type)
      }
      return bufferedDocument
    }, null),
    publishReplay(1),
    refCount()
  )

  // this is where the side effects mandated by local actions actually happens
  const actionHandler$ = actions$.pipe(
    withLatestFrom(bufferedDocument$),
    map(([action, bufferedDocument]) => {
      if (action.type === 'mutation') {
        bufferedDocument.add(new Mutation({mutations: action.mutations}))
      }
      if (action.type === 'commit') {
        bufferedDocument.commit()
      }
      return null
    }),
    filter(Boolean),
    share()
  )

  const emitAction = action => actions$.next(action)

  const addMutations = mutations => emitAction({type: 'mutation', mutations})
  const addMutation = mutation => addMutations([mutation])

  const commit = () =>
    defer(() => {
      emitAction({type: 'commit'})
      return of(null)
    })

  const snapshot$ = bufferedDocument$.pipe(
    distinctUntilChanged((bufDoc, prevBufDoc) => bufDoc.LOCAL === prevBufDoc.LOCAL),
    map(buf => snapshotEventFrom(buf.LOCAL))
  )

  const commitResults$ = commits$.pipe(
    concatMap(commitReq =>
      doCommit(commitReq.payload).pipe(
        tap({
          next: commitReq.onSuccess,
          error: commitReq.onError
        })
      )
    ),
    mapTo({type: 'committed'})
  )

  return {
    updates$: merge(snapshot$, actionHandler$, updates$, commitResults$),
    addMutation,
    addMutations,
    commit
  }
}
