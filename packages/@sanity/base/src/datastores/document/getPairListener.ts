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

function isPublishMutation(msg: ListenerEvent): msg is MutationEvent {
  return msg.type === 'mutation' && msg.transactionId.startsWith('publish')
}

const PUBLISH_START: PublishEvent = {type: 'publish', phase: 'start'}
const PUBLISH_COMPLETE: PublishEvent = {type: 'publish', phase: 'complete'}

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
    concatMap((msg) => {
      if (
        msg.type === 'mutation' &&
        (msg.transition === 'update' || msg.transition === 'appear') &&
        !msg.documentId.startsWith('drafts') &&
        msg.transactionId.startsWith('publish')
      ) {
        console.log('[repro] Published createOrReplace received, delaying emit by 10s')
        return timer(1000 * 10)
          .pipe(mapTo(msg))
          .pipe(tap(() => console.log('releasing publish event')))
      }
      return observableOf(msg)
    }),
    scan(
      (mem: {next: ListenerEvent[]; buffer: ListenerEvent[]}, msg) => {
        const pendingPublishMutation = mem.buffer.find((message) => isPublishMutation(message))
        if (isPublishMutation(msg)) {
          // we expect 2 messages for every publish transaction, so check if we have received both before continuing
          if (pendingPublishMutation) {
            // got both expected messages - we can continue
            console.log('we got all pending mutations, flush the buffer')
            // console.log('YOU MAY RESUME EDIT')
            return {next: mem.buffer.concat([msg, PUBLISH_COMPLETE]), buffer: []}
          }
          // We got the first of two expected messages, buffer until we get both
          console.log(
            'We got the first of two expected publish mutations, start buffering until we get the next'
          )
          // console.log('DO NOT EDIT')
          return {next: [PUBLISH_START], buffer: [msg]}
        }

        if (pendingPublishMutation) {
          console.log(
            'we got a message while waiting for the second publish mutation to arrive, put it in the buffer'
          )
          return {next: [], buffer: mem.buffer.concat(msg)}
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
