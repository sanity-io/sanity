import {type SanityClient} from '@sanity/client'
import {type SanityDocument} from '@sanity/types'
import {distinctUntilChanged, type Observable, Subject} from 'rxjs'
import {filter, map} from 'rxjs/operators'

import {type BufferedDocumentWrapper} from '../buffered-doc/createBufferedDocument'
import {type IdPair} from '../types'
import {type Pair} from './checkoutPair'
// eslint-disable-next-line import/no-duplicates
import {type WorkerInput, type WorkerOutput} from './checkoutPairWorker'
// eslint-disable-next-line import/no-duplicates
// import CheckoutPairWorker from './checkoutPairWorker?worker'

/** @internal */
export function checkoutPair(
  client: SanityClient,
  idPair: IdPair,
  serverActionsEnabled: Observable<boolean>,
): Pair {
  const input$ = new Subject<WorkerInput>()

  // const outputConnector = new Subject<WorkerOutput>()
  const output$ = new Subject<WorkerOutput>()
  // const output$ = outputConnector
  // .pipe(
  //   share({connector: () => outputConnector}),
  // )
  // const worker = new CheckoutPairWorker()
  const worker =
    typeof __DEV__ === 'boolean' && __DEV__
      ? new Worker(new URL('./checkoutPairWorker.ts', import.meta.url), {type: 'module'})
      : new Worker(new URL('../../../../../../web-workers/checkoutPair.mjs', import.meta.url), {
          type: 'module',
        })
  worker.onmessage = (ev: MessageEvent<WorkerOutput>) => {
    return output$.next(ev.data)
  }
  worker.onerror = (ev: ErrorEvent) => {
    // console.log('worker.onerror', ev)
    return output$.error(ev)
  }

  const subscription = input$.subscribe((input) => {
    // console.log('send worker input', input)
    worker.postMessage(input)
  })

  const proxy = (message: WorkerInput): void => {
    // console.log('worker proxy', message)
    // input$.next(message)
    worker.postMessage(message)
  }

  const actionsSub = serverActionsEnabled
    .pipe(distinctUntilChanged())
    .subscribe((isServerActionsEnabled) => {
      // console.log('worker serverActionsEnabled', {isServerActionsEnabled})
      return proxy({
        type: 'construct',
        clientConfig: client.config(),
        idPair,
        serverActionsEnabled: isServerActionsEnabled,
      })
    })

  const transactionsPendingEvents$ = output$.pipe(
    filter(
      (ev): ev is Extract<WorkerOutput, {type: 'transactionsPendingEvents$'}> =>
        ev.type === 'transactionsPendingEvents$',
    ),
    map((ev) => ev.payload),
  )

  // const worker$ = fromWorker<WorkerInput, WorkerOutput>(
  //   () => new CheckoutPairWorker(),
  //   input$,
  //   // ).pipe(share({connector: () => outputConnector}))
  // )

  // worker$.subscribe((event) => {
  //   console.log('worker event', event)
  // })

  /**
   * These need to be handled as worker output:
   * - transactionsPendingEvents$
   * - draft.consistency$
   * - draft.events
   * - draft.remoteSnapshot$
   * - published.consistency$
   * - published.events
   * - published.remoteSnapshot$
   *
   * While these should be the worker input:
   * - draft.commit
   * - draft.create
   * - draft.createIfNotExists
   * - draft.createOrReplace
   * - draft.delete
   * - draft.mutate
   * - draft.patch
   * - published.commit
   * - published.create
   * - published.createIfNotExists
   * - published.createOrReplace
   * - published.delete
   * - published.mutate
   * - published.patch
   * - complete
   */

  const shimBufferedDocumentHelpers = (documentId: string) => {
    const prepare = (id: string) => (document: Partial<SanityDocument>) => {
      const {_id, _rev, _updatedAt, ...rest} = document
      return {_id: id, ...rest}
    }

    const prepareDoc = prepare(documentId)

    const DELETE = {delete: {id: documentId}}

    return {
      patch: (patches) => patches.map((patch) => ({patch: {...patch, id: documentId}})),
      create: (document) => ({create: prepareDoc(document)}),
      createIfNotExists: (document) => ({createIfNotExists: prepareDoc(document)}),
      createOrReplace: (document) => ({createOrReplace: prepareDoc(document)}),
      delete: () => DELETE,
    } satisfies Pick<
      BufferedDocumentWrapper,
      'patch' | 'create' | 'createIfNotExists' | 'createOrReplace' | 'delete'
    >
  }
  const {publishedId, draftId} = idPair

  return {
    transactionsPendingEvents$,
    draft: {
      ...shimBufferedDocumentHelpers(draftId),
      consistency$: output$.pipe(
        filter(
          (ev): ev is Extract<WorkerOutput, {type: 'draft.consistency$'}> =>
            ev.type === 'draft.consistency$',
        ),
        map((ev) => ev.payload),
      ),
      events: output$.pipe(
        filter(
          (ev): ev is Extract<WorkerOutput, {type: 'draft.events'}> => ev.type === 'draft.events',
        ),
        map((ev) => ev.payload),
      ),
      remoteSnapshot$: output$.pipe(
        filter(
          (ev): ev is Extract<WorkerOutput, {type: 'draft.remoteSnapshot$'}> =>
            ev.type === 'draft.remoteSnapshot$',
        ),
        map((ev) => ev.payload),
      ),
      commit: () => proxy({type: 'draft.commit'}),
      mutate: (mutations) => proxy({type: 'draft.mutate', payload: mutations}),
    },
    published: {
      ...shimBufferedDocumentHelpers(publishedId),
      consistency$: output$.pipe(
        filter(
          (ev): ev is Extract<WorkerOutput, {type: 'published.consistency$'}> =>
            ev.type === 'published.consistency$',
        ),
        map((ev) => ev.payload),
      ),
      events: output$.pipe(
        filter(
          (ev): ev is Extract<WorkerOutput, {type: 'published.events'}> =>
            ev.type === 'published.events',
        ),
        map((ev) => ev.payload),
      ),
      remoteSnapshot$: output$.pipe(
        filter(
          (ev): ev is Extract<WorkerOutput, {type: 'published.remoteSnapshot$'}> =>
            ev.type === 'published.remoteSnapshot$',
        ),
        map((ev) => ev.payload),
      ),
      commit: () => proxy({type: 'published.commit'}),
      mutate: (mutations) => proxy({type: 'published.mutate', payload: mutations}),
    },
    complete: () => {
      actionsSub.unsubscribe()
      subscription.unsubscribe()

      // if (!output$.observed) {
      // eslint-disable-next-line no-console
      console.log('terminating worker soon')
      // Schedule teardown to temporarily workaround react strict mode cancelling initial load
      setTimeout(() => {
        // eslint-disable-next-line no-console
        console.log('terminating worker now')
        worker.terminate()
      }, 10000)
      // }
      // return outputConnector.complete()
    },
  }
}

export type {
  DocumentVersion,
  DocumentVersionEvent,
  Pair,
  RemoteSnapshotVersionEvent,
  WithVersion,
} from './checkoutPair'
