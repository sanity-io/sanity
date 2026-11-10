import {type QueryParams, type SanityClient} from '@sanity/client'
import sortedIndex from 'lodash-es/sortedIndex.js'
import {of} from 'rxjs'
import {distinctUntilChanged, filter, map, mergeMap, scan, tap} from 'rxjs/operators'

import {type SourceClientOptions} from '../config/types'
import {versionedClient} from '../studioClient'

export type DocumentIdSetObserverState = {
  status: 'reconnecting' | 'connected'
  documentIds: string[]
}

interface LiveDocumentIdSetOptions {
  insert?: 'sorted' | 'prepend' | 'append'
  apiVersion?: SourceClientOptions['apiVersion']
}

export function createDocumentIdSetObserver(client: SanityClient) {
  return function observe(
    queryFilter: string,
    params?: QueryParams,
    options: LiveDocumentIdSetOptions = {},
  ) {
    const {insert: insertOption = 'sorted', apiVersion} = options

    const query = `*[${queryFilter}]._id`
    function fetchFilter() {
      return versionedClient(client, apiVersion)
        .observable.fetch(query, params, {
          tag: 'preview.observe-document-set.fetch',
        })
        .pipe(
          tap((result) => {
            if (!Array.isArray(result)) {
              throw new Error(
                `Expected query to return array of documents, but got ${typeof result}`,
              )
            }
          }),
        )
    }
    return versionedClient(client, apiVersion)
      .observable.listen(`*[${queryFilter}]`, params, {
        visibility: 'transaction',
        events: ['welcome', 'mutation', 'reconnect'],
        includeResult: false,
        includeMutations: false,
        includeAllVersions: true,
        tag: 'preview.observe-document-set.listen',
      })
      .pipe(
        mergeMap((event, index) => {
          const live = event.type === 'welcome'
          // A reconnect before welcome: the listener is down before it delivered anything, so the
          // set is fetched without it, and fetched again once the listener welcomes.
          if (live || (index === 0 && event.type === 'reconnect')) {
            return fetchFilter().pipe(map((result) => ({type: 'fetch' as const, result, live})))
          }
          return of(event)
        }),
        scan(
          (
            state: DocumentIdSetObserverState | undefined,
            event,
          ): DocumentIdSetObserverState | undefined => {
            if (event.type === 'reconnect') {
              return {
                documentIds: state?.documentIds || [],
                ...state,
                status: 'reconnecting' as const,
              }
            }
            if (event.type === 'fetch') {
              // A fetch made while the listener was down never replaces what a live one loaded.
              if (!event.live && state?.status === 'connected') {
                return state
              }
              return {
                ...state,
                status: event.live ? ('connected' as const) : ('reconnecting' as const),
                documentIds: event.result,
              }
            }
            if (event.type === 'mutation') {
              if (event.transition === 'update') {
                // ignore updates, as we're only interested in documents appearing and disappearing from the set
                return state
              }
              if (event.transition === 'appear') {
                return {
                  status: 'connected',
                  documentIds: insert(state?.documentIds || [], event.documentId, insertOption),
                }
              }
              if (event.transition === 'disappear') {
                return {
                  status: 'connected',
                  documentIds: state?.documentIds
                    ? state.documentIds.filter((id) => id !== event.documentId)
                    : [],
                }
              }
            }
            return state
          },
          undefined,
        ),
        distinctUntilChanged(),
        filter(
          (state: DocumentIdSetObserverState | undefined): state is DocumentIdSetObserverState =>
            state !== undefined,
        ),
      )
  }
}

function insert<T>(array: T[], element: T, strategy: 'sorted' | 'prepend' | 'append') {
  let index
  if (strategy === 'prepend') {
    index = 0
  } else if (strategy === 'append') {
    index = array.length
  } else {
    index = sortedIndex(array, element)
  }

  return array.toSpliced(index, 0, element)
}
