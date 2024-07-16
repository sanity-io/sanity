import {type MutationEvent, type SanityClient, type WelcomeEvent} from '@sanity/client'
import {uniq} from 'lodash'
import {EMPTY, type Observable, of} from 'rxjs'
import {concatMap, map, scan} from 'rxjs/operators'

import {debounceCollect} from './utils/debounceCollect'

export function createObserveDocument({
  mutationChannel,
  client,
}: {
  client: SanityClient
  mutationChannel: Observable<WelcomeEvent | MutationEvent>
}) {
  function batchFetchDocuments(ids: string[][]) {
    return client.observable
      .fetch(`*[_id in $ids]`, {ids: uniq(ids.flat())}, {tag: 'preview.observe-document'})
      .pipe(map((result) => ids.map((id) => result.find(id))))
  }

  const fetchDocument = debounceCollect(batchFetchDocuments, 10)

  return function observeDocument(id: string) {
    return mutationChannel.pipe(
      concatMap((event) => {
        if (event.type === 'welcome') {
          return fetchDocument(id).pipe(map((document) => ({type: 'sync', document})))
        }
        return event.documentId === id ? of(event) : EMPTY
      }),
      scan((current, event) => {
        if (event.type === 'sync') {
          return event.document
        }
        if (event.type === 'mutation') {
          return current
        }
      }, undefined),
    )
  }
}
