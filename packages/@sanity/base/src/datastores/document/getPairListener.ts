/* eslint-disable @typescript-eslint/no-use-before-define,no-console */
import type {SanityDocument} from '@sanity/types'
import {defer, Observable, of as observableOf, timer} from 'rxjs'
import {concatMap, map, mapTo, mergeMap, scan, tap} from 'rxjs/operators'
import type {
  IdPair,
  MutationEvent,
  PublishEvent,
  ReconnectEvent,
  SanityClient,
  WelcomeEvent,
} from './types'

const SIMULATE_SLOW_CONNECTION = true

interface Snapshots {
  draft: SanityDocument | null
  published: SanityDocument | null
}

export interface InitialSnapshotEvent {
  type: 'snapshot'
  documentId: string
  document: SanityDocument | null
}

export interface PairListenerOptions {
  tag?: string
}

export type {MutationEvent}

export type ListenerEvent = MutationEvent | ReconnectEvent | InitialSnapshotEvent | PublishEvent

const PUBLISH_RECEIVED: PublishEvent = {type: 'publish', phase: 'received'}
const PUBLISH_SUCCESS: PublishEvent = {type: 'publish', phase: 'success'}

// @todo replace implementation with a proper one once we get required backend suppoert
function isPublishMutation(msg: ListenerEvent): msg is MutationEvent {
  return msg.type === 'mutation' && msg.transactionId.startsWith('publish')
}

// @todo replace implementation with a proper one once we get required backend suppoert
function allTransactionMessagesReceived(listenerEvents: ListenerEvent[]) {
  const publishEvents = listenerEvents.filter(isPublishMutation)
  return !publishEvents.some((mut) => {
    const [, id] = mut.transactionId.split('publish-')
    return !publishEvents.find((m) => {
      const [, otherId] = m.transactionId.split('publish-')
      return m !== mut && id === otherId
    })
  })
}

export function getPairListener(
  client: SanityClient,
  idPair: IdPair,
  options: PairListenerOptions = {}
) {
  const {publishedId, draftId} = idPair
  return defer(
    () =>
      client.observable.listen(
        `*[_id == $publishedId || _id == $draftId]`,
        {
          publishedId,
          draftId,
        },
        {
          includeResult: false,
          events: ['welcome', 'mutation', 'reconnect'],
          effectFormat: 'mendoza',
          tag: options.tag || 'document.pair-listener',
        }
      ) as Observable<WelcomeEvent | MutationEvent | ReconnectEvent>
  ).pipe(
    concatMap((event) =>
      event.type === 'welcome'
        ? fetchInitialDocumentSnapshots().pipe(
            concatMap((snapshots) => [
              createSnapshotEvent(draftId, snapshots.draft),
              createSnapshotEvent(publishedId, snapshots.published),
            ])
          )
        : observableOf(event)
    ),
    // @todo: remove this
    SIMULATE_SLOW_CONNECTION
      ? mergeMap((msg) => {
          if (msg.type === 'mutation' && msg.transactionId.startsWith('publish')) {
            const isCreateOrReplace = msg.transition === 'update' || msg.transition === 'appear'
            const delay = isCreateOrReplace ? 10 : 5
            console.log(
              '[repro] Published "%s" received, delaying emit by %ds',
              isCreateOrReplace ? 'createOrReplace' : 'delete',
              delay
            )
            return timer(1000 * delay)
              .pipe(mapTo(msg))
              .pipe(tap(() => console.log('releasing publish event')))
          }
          return observableOf(msg)
        })
      : tap(),
    scan(
      (acc: {next: ListenerEvent[]; buffer: ListenerEvent[]}, msg) => {
        if (isPublishMutation(msg)) {
          const nextBuffer = acc.buffer.concat(msg)
          if (allTransactionMessagesReceived(nextBuffer)) {
            console.log('we got all pending mutations, flush the buffer')
            return {next: nextBuffer.concat(PUBLISH_SUCCESS), buffer: []}
          }

          // We still miss some mutations
          console.log(
            'We got the first of two expected publish mutations, start buffering until we get the next'
          )
          // console.log('DO NOT EDIT')
          return {next: [PUBLISH_RECEIVED], buffer: [msg]}
        }

        if (acc.buffer.length > 0) {
          console.log(
            'we got a message while waiting for the second publish mutation to arrive, put it in the buffer'
          )
          return {next: [], buffer: acc.buffer.concat(msg)}
        }
        return {next: [msg], buffer: []}
      },
      {next: [], buffer: []}
    ),
    mergeMap((v) => v.next)
  )

  function fetchInitialDocumentSnapshots(): Observable<Snapshots> {
    return client.observable
      .getDocuments<SanityDocument>([draftId, publishedId], {tag: 'document.snapshots'})
      .pipe(
        map(([draft, published]) => ({
          draft,
          published,
        }))
      )
  }
}

function createSnapshotEvent(
  documentId: string,
  document: null | SanityDocument
): InitialSnapshotEvent {
  return {
    type: 'snapshot',
    documentId,
    document,
  }
}
