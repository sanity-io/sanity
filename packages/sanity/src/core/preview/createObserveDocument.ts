import {type MutationEvent, type SanityClient, type WelcomeEvent} from '@sanity/client'
import {type SanityDocument} from '@sanity/types'
import memoize from 'lodash-es/memoize.js'
import uniq from 'lodash-es/uniq.js'
import {type RawPatch} from 'mendoza'
import {EMPTY, finalize, type Observable, of, throwError} from 'rxjs'
import {catchError, concatMap, map, scan, shareReplay, skipWhile} from 'rxjs/operators'

import {
  OutOfSyncError,
  sequentializeListenerEvents,
} from '../store/document/utils/sequentializeListenerEvents'
import {applyMutationEventEffects} from './utils/applyMendozaPatch'
import {debounceCollect} from './utils/debounceCollect'

export type ListenerMutationEventLike = Pick<
  MutationEvent,
  'type' | 'documentId' | 'previousRev' | 'resultRev' | 'transition'
> & {
  effects?: {
    apply: unknown[]
  }
}

/**
 * How long mutations that don't chain onto the document's revision wait for the ones missing
 * between them, before the document is fetched again. A fetch is a single batched query, so this
 * is far shorter than the document pair's deadline.
 */
const RESOLVE_CHAIN_DEADLINE_MS = 5_000

type DocumentEvent =
  | {type: 'snapshot'; document: SanityDocument | null}
  | (ListenerMutationEventLike & {resultRev: string; messageReceivedAt: string})
export interface ObserveDocumentAPIConfig {
  dataset?: string
  projectId?: string
  apiVersion?: string
}

export function createObserveDocument({
  mutationChannel,
  client,
}: {
  client: SanityClient
  mutationChannel: Observable<WelcomeEvent | ListenerMutationEventLike>
}) {
  const getBatchFetcher = memoize(
    function getBatchFetcher(apiConfig: {dataset: string; projectId: string; apiVersion: string}) {
      const _client = client.withConfig(apiConfig)

      function batchFetchDocuments(ids: [string][]) {
        return _client.observable
          .fetch(`*[_id in $ids]`, {ids: uniq(ids.flat())}, {tag: 'preview.observe-document'})
          .pipe(map((result) => ids.map(([id]) => result.find((r: {_id: string}) => r._id === id))))
      }
      return debounceCollect(batchFetchDocuments, 100)
    },
    (apiConfig) => apiConfig.dataset + apiConfig.projectId + apiConfig.apiVersion,
  )

  const MEMO: Record<string, Observable<SanityDocument | undefined>> = {}

  function observeDocument(id: string, apiConfig?: ObserveDocumentAPIConfig) {
    const _apiConfig = {
      dataset: apiConfig?.dataset || client.config().dataset!,
      projectId: apiConfig?.projectId || client.config().projectId!,
      apiVersion: apiConfig?.apiVersion || client.config().apiVersion,
    }
    const fetchDocument = getBatchFetcher(_apiConfig)
    return mutationChannel.pipe(
      concatMap((event): Observable<DocumentEvent> => {
        if (event.type === 'welcome') {
          return fetchDocument(id).pipe(
            map((document) => ({type: 'snapshot' as const, document: document ?? null})),
          )
        }
        // every mutation the listener reports has a `resultRev`, the client types it as optional
        if (event.documentId !== id || event.resultRev === undefined) {
          return EMPTY
        }
        return of({
          ...event,
          resultRev: event.resultRev,
          messageReceivedAt: new Date().toISOString(),
        })
      }),
      // mutations are put in sequence on top of a fetched document
      skipWhile((event) => event.type !== 'snapshot'),
      sequentializeListenerEvents<DocumentEvent>({
        resolveChainDeadline: RESOLVE_CHAIN_DEADLINE_MS,
      }),
      scan(
        (current: SanityDocument | undefined, event) =>
          event.type === 'snapshot'
            ? (event.document ?? undefined)
            : applyMutationEvent(current, event),
        undefined,
      ),
      // a resubscription gets the listener's latest welcome replayed, which fetches the document again
      catchError((error, caught$) =>
        error instanceof OutOfSyncError ? caught$ : throwError(() => error),
      ),
    )
  }
  return function memoizedObserveDocument(id: string, apiConfig?: ObserveDocumentAPIConfig) {
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

function applyMutationEvent(current: SanityDocument | undefined, event: ListenerMutationEventLike) {
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
