import {type MutationEvent, type SanityClient, type WelcomeEvent} from '@sanity/client'
import {type SanityDocument} from '@sanity/types'
import {memoize, uniq} from 'lodash'
import {type RawPatch} from 'mendoza'
import {EMPTY, finalize, type Observable, of} from 'rxjs'
import {concatMap, map, scan, shareReplay} from 'rxjs/operators'

import {type ApiConfig} from './types'
import {applyMutationEventEffects} from './utils/applyMendozaPatch'
import {debounceCollect} from './utils/debounceCollect'

export function createObserveDocument({
  mutationChannel,
  client,
}: {
  client: SanityClient
  mutationChannel: Observable<WelcomeEvent | MutationEvent>
}) {
  const getBatchFetcher = memoize(
    function getBatchFetcher(apiConfig: {dataset: string; projectId: string}) {
      const _client = client.withConfig(apiConfig)

      function batchFetchDocuments(ids: [string][]) {
        return _client.observable
          .fetch(`*[_id in $ids]`, {ids: uniq(ids.flat())}, {tag: 'preview.observe-document'})
          .pipe(
            // eslint-disable-next-line max-nested-callbacks
            map((result) => ids.map(([id]) => result.find((r: {_id: string}) => r._id === id))),
          )
      }
      return debounceCollect(batchFetchDocuments, 100)
    },
    (apiConfig) => apiConfig.dataset + apiConfig.projectId,
  )

  const MEMO: Record<string, Observable<SanityDocument | undefined>> = {}

  function observeDocument(id: string, apiConfig?: ApiConfig) {
    const _apiConfig = apiConfig || {
      dataset: client.config().dataset!,
      projectId: client.config().projectId!,
    }
    const fetchDocument = getBatchFetcher(_apiConfig)
    return mutationChannel.pipe(
      concatMap((event) => {
        if (event.type === 'welcome') {
          return fetchDocument(id).pipe(map((document) => ({type: 'sync' as const, document})))
        }
        return event.documentId === id ? of(event) : EMPTY
      }),
      scan((current: SanityDocument | undefined, event) => {
        if (event.type === 'sync') {
          return event.document
        }
        if (event.type === 'mutation') {
          return applyMutationEvent(current, event)
        }
        //@ts-expect-error - this should never happen
        throw new Error(`Unexpected event type: "${event.type}"`)
      }, undefined),
    )
  }
  return function memoizedObserveDocument(id: string, apiConfig?: ApiConfig) {
    const key = apiConfig ? `${id}-${JSON.stringify(apiConfig)}` : id
    if (!(key in MEMO)) {
      MEMO[key] = observeDocument(id, apiConfig).pipe(
        finalize(() => delete MEMO[key]),
        shareReplay({bufferSize: 1, refCount: true}),
      )
    }
    return MEMO[key]
  }
}

function applyMutationEvent(current: SanityDocument | undefined, event: MutationEvent) {
  if (event.previousRev !== current?._rev) {
    console.warn('Document out of sync, skipping mutation')
    return current
  }
  if (!event.effects) {
    throw new Error(
      'Mutation event is missing effects. Is the listener set up with effectFormat=mendoza?',
    )
  }
  return applyMutationEventEffects(
    current,
    event as {effects: {apply: RawPatch}; previousRev: string; resultRev: string},
  )
}
