import {
  defer,
  EMPTY,
  filter,
  lastValueFrom,
  map,
  merge,
  mergeMap,
  type Observable,
  of,
  Subject,
  tap,
  toArray,
} from 'rxjs'

import {decodeAll, type SanityMutation} from '../encoders/sanity'
import {type Transaction} from '../mutations/types'
import {applyMendozaPatch} from './datasets/applyMendoza'
import {applyMutations} from './datasets/applyMutations'
import {commit} from './datasets/commit'
import {createDataset} from './datasets/createDataset'
import {squashDMPStrings} from './optimizations/squashDMPStrings'
import {squashMutationGroups} from './optimizations/squashMutations'
import {rebase} from './rebase'
import {
  type ContentLakeStore,
  type MutationGroup,
  type OptimisticDocumentEvent,
  type RemoteDocumentEvent,
  type RemoteListenerEvent,
  type SubmitResult,
  type TransactionalMutationGroup,
} from './types'
import {filterMutationGroupsById} from './utils/filterMutationGroups'
import {createMemoizer} from './utils/memoize'

export interface StoreBackend {
  /**
   * Sets up a subscription to a document
   * The first event should either be a sync event or an error event.
   * After that, it should emit mutation events, error events or sync events
   * @param id
   */
  observe: (id: string) => Observable<RemoteListenerEvent>
  submit: (mutationGroups: Transaction[]) => Observable<SubmitResult>
}

export function createContentLakeStore(
  backend: StoreBackend,
): ContentLakeStore {
  const local = createDataset()
  const remote = createDataset()
  const memoize = createMemoizer()
  let stagedChanges: MutationGroup[] = []

  const remoteEvents$ = new Subject<RemoteDocumentEvent>()
  const localMutations$ = new Subject<OptimisticDocumentEvent>()

  const stage$ = new Subject<void>()

  function stage(nextPending: MutationGroup[]) {
    stagedChanges = nextPending
    stage$.next()
  }

  function getLocalEvents(id: string) {
    return localMutations$.pipe(filter(event => event.id === id))
  }

  function getRemoteEvents(id: string) {
    return backend.observe(id).pipe(
      mergeMap((event): Observable<RemoteDocumentEvent> => {
        const oldLocal = local.get(id)
        const oldRemote = remote.get(id)
        if (event.type === 'sync') {
          const newRemote = event.document
          const [rebasedStage, newLocal] = rebase(
            id,
            oldRemote,
            newRemote,
            stagedChanges,
          )
          return of({
            type: 'sync',
            id,
            before: {remote: oldRemote, local: oldLocal},
            after: {remote: newRemote, local: newLocal},
            rebasedStage,
          })
        } else if (event.type === 'mutation') {
          // we have already seen this mutation
          if (event.transactionId === oldRemote?._rev) {
            return EMPTY
          }

          const newRemote = applyMendozaPatch(oldRemote, event.effects)
          if (newRemote) {
            newRemote._rev = event.transactionId
          }

          const [rebasedStage, newLocal] = rebase(
            id,
            oldRemote,
            newRemote,
            stagedChanges,
          )

          if (newLocal) {
            newLocal._rev = event.transactionId
          }

          return of({
            type: 'mutation',
            id,
            rebasedStage,
            before: {remote: oldRemote, local: oldLocal},
            after: {remote: newRemote, local: newLocal},
            effects: event.effects,
            mutations: decodeAll(event.mutations as SanityMutation[]),
          })
        } else {
          throw new Error(`Unknown event type: ${event.type}`)
        }
      }),
      tap(event => {
        local.set(event.id, event.after.local)
        remote.set(event.id, event.after.remote)
        stage(event.rebasedStage)
      }),
      tap({
        next: event => remoteEvents$.next(event),
        error: err => {
          // todo: how to propagate errors?
          // remoteEvents$.next()
        },
      }),
    )
  }

  function observeEvents(id: string) {
    return defer(() =>
      memoize(id, merge(getLocalEvents(id), getRemoteEvents(id))),
    )
  }

  const metaEvents$ = merge(localMutations$, remoteEvents$)

  return {
    meta: {
      events: metaEvents$,
      stage: stage$.pipe(
        map(
          () =>
            // note: this should not be tampered with by consumers. We might want to do a deep-freeze during dev to avoid accidental mutations
            stagedChanges,
        ),
      ),
      conflicts: EMPTY, // does nothing for now
    },
    mutate: mutations => {
      // add mutations to list of pending changes
      stagedChanges.push({transaction: false, mutations})
      // Apply mutations to local dataset (note: this is immutable, and doesn't change the dataset)
      const results = applyMutations(mutations, local)
      // Write the updated results back to the "local" dataset
      commit(results, local)
      results.forEach(result => {
        localMutations$.next({
          type: 'optimistic',
          before: result.before,
          after: result.after,
          mutations: result.mutations,
          id: result.id,
          stagedChanges: filterMutationGroupsById(stagedChanges, result.id),
        })
      })
      return results
    },
    transaction: mutationsOrTransaction => {
      const transaction: TransactionalMutationGroup = Array.isArray(
        mutationsOrTransaction,
      )
        ? {mutations: mutationsOrTransaction, transaction: true}
        : {...mutationsOrTransaction, transaction: true}

      stagedChanges.push(transaction)
      const results = applyMutations(transaction.mutations, local)
      commit(results, local)
      results.forEach(result => {
        localMutations$.next({
          type: 'optimistic',
          mutations: result.mutations,
          id: result.id,
          before: result.before,
          after: result.after,
          stagedChanges: filterMutationGroupsById(stagedChanges, result.id),
        })
      })
      return results
    },
    observeEvents,
    observe: id =>
      observeEvents(id).pipe(
        map(event =>
          event.type === 'optimistic' ? event.after : event.after.local,
        ),
      ),
    optimize: () => {
      stage(squashMutationGroups(stagedChanges))
    },
    submit: () => {
      const pending = stagedChanges
      stage([])
      return lastValueFrom(
        backend
          .submit(
            toTransactions(
              // Squashing DMP strings is the last thing we do before submitting
              squashDMPStrings(remote, squashMutationGroups(pending)),
            ),
          )
          .pipe(toArray()),
      )
    },
  }
}

function toTransactions(groups: MutationGroup[]): Transaction[] {
  return groups.map(group => {
    if (group.transaction && group.id !== undefined) {
      return {id: group.id!, mutations: group.mutations}
    }
    return {mutations: group.mutations}
  })
}
