import {EMPTY, from, merge, Observable} from 'rxjs'
import {
  bufferTime,
  concatMap,
  distinctUntilChanged,
  filter,
  map,
  mergeMapTo,
  share,
  shareReplay,
  startWith,
  tap,
} from 'rxjs/operators'
import {groupBy} from 'lodash'
import {Mut} from '@sanity/mutator/dist/dts/document/types'
import {versionedClient} from '../../../client/versionedClient'
import {getPairListener, ListenerEvent} from '../getPairListener'
import {BufferedDocumentEvent, createBufferedDocument} from '../buffered-doc/createBufferedDocument'
import {IdPair, Mutation, PublishEvent, ReconnectEvent} from '../types'
import {RemoteSnapshotEvent} from '../buffered-doc/types'
import {CommitRequest} from '../buffered-doc/createObservableBufferedDocument'

const isMutationEventForDocId = (id: string) => (event: ListenerEvent): boolean =>
  event.type !== 'reconnect' && event.type !== 'publish' && event.documentId === id

type WithVersion<T> = T & {version: 'published' | 'draft'}

export type DocumentVersionEvent = WithVersion<ReconnectEvent | BufferedDocumentEvent>
export type RemoteSnapshotVersionEvent = WithVersion<RemoteSnapshotEvent>

export interface DocumentVersion {
  consistency$: Observable<boolean>
  remoteSnapshot$: Observable<RemoteSnapshotVersionEvent>
  commits$: Observable<CommitRequest>
  events: Observable<DocumentVersionEvent>

  patch: (patches) => Mutation[]
  create: (document) => Mutation
  createIfNotExists: (document) => Mutation
  createOrReplace: (document) => Mutation
  delete: () => Mutation

  mutate: (mutations: Mutation[]) => void
  commit: (transactionId?: string) => void
}

export interface Pair {
  publishing: Observable<boolean>
  published: DocumentVersion
  draft: DocumentVersion
}

function setVersion<T>(version: 'draft' | 'published') {
  return (ev: T): T & {version: 'draft' | 'published'} => ({...ev, version})
}

function commitMutations(mutations: Mut[], transactionId: string) {
  return versionedClient.dataRequest(
    'mutate',
    {mutations, transactionId},
    {
      visibility: 'async',
      returnDocuments: false,
      tag: 'document.commit',
    }
  )
}

function submitCommitRequest(
  mutations: Mut[],
  transactionId: string,
  callbacks: {cancel: (err) => void; failure: () => void; success: () => void}
) {
  return from(commitMutations(mutations, transactionId)).pipe(
    tap({
      error: (error) => {
        const isBadRequest =
          error.name === 'ClientError' && error.statusCode >= 400 && error.statusCode <= 500
        if (isBadRequest) {
          callbacks.cancel(error)
        } else {
          callbacks.failure()
        }
      },
      next: () => callbacks.success(),
    })
  )
}

export function checkoutPair(idPair: IdPair): Pair {
  const {publishedId, draftId} = idPair

  const listenerEvents$ = getPairListener(versionedClient, idPair).pipe(share())

  const reconnect$ = listenerEvents$.pipe(filter((ev) => ev.type === 'reconnect')) as Observable<
    ReconnectEvent
  >

  const publishing = listenerEvents$.pipe(
    filter((ev): ev is PublishEvent => ev.type === 'publish'),
    // tap((ev) => console.log(ev.phase === 'start' ? 'DO NOT EDIT' : 'YOU MAY RESUME EDIT')),
    map((ev) => ev.phase === 'start'),
    // mergeMapTo(EMPTY),
    startWith(false),
    distinctUntilChanged(),
    shareReplay(1)
  )

  const draft = createBufferedDocument(
    draftId,
    listenerEvents$.pipe(filter(isMutationEventForDocId(draftId)))
  )

  const published = createBufferedDocument(
    publishedId,
    listenerEvents$.pipe(filter(isMutationEventForDocId(publishedId)))
  )

  const commits$ = merge(draft.commits$, published.commits$).pipe(
    bufferTime(0),
    filter((buf) => buf.length > 0),
    concatMap((reqs) => {
      const groups = groupBy(reqs, (req) => req.mutation.transactionId)
      const transactions = Object.keys(groups).map((transactionId) => ({id: transactionId, reqs}))

      return from(transactions).pipe(
        concatMap((transaction) => {
          const success = () => {
            transaction.reqs.forEach((r) => r.success())
          }
          const failure = () => {
            transaction.reqs.forEach((r) => r.failure())
          }
          const cancel = (err: Error) => {
            transaction.reqs.forEach((r) => r.cancel(err))
          }
          const muts = transaction.reqs.flatMap((req) => req.mutation.params.mutations)
          return submitCommitRequest(muts, transaction.id, {success, failure, cancel})
        })
      )
    }),
    mergeMapTo(EMPTY),
    share()
  )

  return {
    publishing,
    draft: {
      ...draft,
      events: merge(commits$, reconnect$, draft.events).pipe(map(setVersion('draft'))),
      consistency$: merge(commits$, draft.consistency$),
      remoteSnapshot$: draft.remoteSnapshot$.pipe(map(setVersion('draft'))),
    },
    published: {
      ...published,
      events: merge(commits$, reconnect$, published.events).pipe(map(setVersion('published'))),
      consistency$: published.consistency$,
      remoteSnapshot$: published.remoteSnapshot$.pipe(map(setVersion('published'))),
    },
  }
}
