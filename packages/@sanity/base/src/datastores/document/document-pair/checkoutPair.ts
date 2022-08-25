import {EMPTY, from, merge, Observable, Subject} from 'rxjs'
import {bufferTime, concatMap, filter, finalize, map, mergeMapTo, share, tap} from 'rxjs/operators'
import {groupBy} from 'lodash'
import {versionedClient} from '../../../client/versionedClient'
import {getPairListener, ListenerEvent} from '../getPairListener'
import {BufferedDocumentEvent, createBufferedDocument} from '../buffered-doc/createBufferedDocument'
import {IdPair, Mutation, PublishEvent, ReconnectEvent} from '../types'
import {RemoteSnapshotEvent} from '../buffered-doc/types'
import {getPublishedId} from '../../../util/draftUtils'

const isMutationEventForDocId = (id: string) => (
  event: ListenerEvent
): event is Exclude<ListenerEvent, ReconnectEvent | PublishEvent> => {
  return event.type !== 'reconnect' && event.type !== 'publish' && event.documentId === id
}

type WithVersion<T> = T & {version: 'published' | 'draft'}

export type DocumentVersionEvent = WithVersion<ReconnectEvent | BufferedDocumentEvent>
export type RemoteSnapshotVersionEvent = WithVersion<RemoteSnapshotEvent>

export interface DocumentVersion {
  consistency$: Observable<boolean>
  remoteSnapshot$: Observable<RemoteSnapshotVersionEvent>
  events: Observable<DocumentVersionEvent>

  patch: (patches) => Mutation[]
  create: (document) => Mutation
  createIfNotExists: (document) => Mutation
  createOrReplace: (document) => Mutation
  delete: () => Mutation

  mutate: (mutations: Mutation[]) => void
  commit: () => void
}

export interface Pair {
  publishEvents$: Observable<PublishEvent>
  published: DocumentVersion
  draft: DocumentVersion
}

function setVersion<T>(version: 'draft' | 'published') {
  return (ev: T): T & {version: 'draft' | 'published'} => ({...ev, version})
}

function commitMutations(mutations: Mutation[], transactionId?: string) {
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
  mutations: Mutation[],
  transactionId: string,
  callbacks: {cancel: (err: Error) => void; failure: (err: Error) => void; success: () => void}
) {
  return from(commitMutations(mutations, transactionId)).pipe(
    tap({
      error: (error) => {
        const isBadRequest =
          error.name === 'ClientError' && error.statusCode >= 400 && error.statusCode <= 500
        if (isBadRequest) {
          callbacks.cancel(error)
        } else {
          callbacks.failure(error)
        }
      },
      next: () => callbacks.success(),
    })
  )
}

function isPublishTransaction(mutations: Mutation[]) {
  const deleteDraftMutations = mutations.filter((mut) => mut.delete?.id)
  const createOrReplaceMutations = mutations.filter((mut) => mut.createOrReplace?._id)
  return (
    deleteDraftMutations.length === 1 &&
    createOrReplaceMutations.length === 1 &&
    createOrReplaceMutations[0].createOrReplace._id ===
      getPublishedId(deleteDraftMutations[0].delete.id)
  )
}

export function checkoutPair(idPair: IdPair): Pair {
  const {publishedId, draftId} = idPair

  const listenerEvents$ = getPairListener(versionedClient, idPair).pipe(share())

  const reconnect$ = listenerEvents$.pipe(filter((ev) => ev.type === 'reconnect')) as Observable<
    ReconnectEvent
  >

  const draft = createBufferedDocument(
    draftId,
    listenerEvents$.pipe(filter(isMutationEventForDocId(draftId)))
  )

  const published = createBufferedDocument(
    publishedId,
    listenerEvents$.pipe(filter(isMutationEventForDocId(publishedId)))
  )

  const remotePublishEvents$ = listenerEvents$.pipe(
    filter((ev): ev is PublishEvent => ev.type === 'publish')
  )
  const localPublishEvents$ = new Subject<PublishEvent>()

  const commits$ = merge(draft.commitRequest$, published.commitRequest$).pipe(
    // collect all requests within the same event loop
    bufferTime(0),
    filter((buf) => buf.length > 0),
    concatMap((reqs) => {
      const groupedTransactions = groupBy(reqs, (req) => req.mutation.transactionId)
      return from(Object.values(groupedTransactions)).pipe(
        concatMap((transaction) => {
          const mutations = transaction.flatMap((req) => req.mutation.params.mutations)
          if (isPublishTransaction(mutations)) {
            localPublishEvents$.next({type: 'publish', phase: 'init'})
          }
          return submitCommitRequest(mutations, transaction[0].mutation.transactionId, {
            success: () => transaction.forEach((r) => r.success()),
            failure: (err: Error) => transaction.forEach((r) => r.failure(err)),
            cancel: (err: Error) => transaction.forEach((r) => r.cancel(err)),
          })
        })
      )
    }),
    mergeMapTo(EMPTY),
    share()
  )

  return {
    publishEvents$: merge(localPublishEvents$, remotePublishEvents$),
    draft: {
      ...draft,
      events: merge(commits$, reconnect$, draft.events).pipe(map(setVersion('draft'))),
      consistency$: draft.consistency$,
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
