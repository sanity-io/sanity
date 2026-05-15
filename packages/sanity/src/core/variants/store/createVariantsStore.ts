import {type SanityClient} from '@sanity/client'
import {type Dispatch} from 'react'
import {
  BehaviorSubject,
  catchError,
  concat,
  concatWith,
  filter,
  merge,
  type Observable,
  of,
  scan,
  shareReplay,
  Subject,
  switchMap,
  tap,
} from 'rxjs'
import {map, startWith} from 'rxjs/operators'

import {listenQuery} from '../../store'
import {type SystemVariant} from '../types'
import {VARIANT_DOCUMENTS_PATH, VARIANT_DOCUMENT_TYPE} from './constants'
import {variantStoreReducer, type VariantStoreAction, type VariantStoreState} from './reducer'

type ActionWrapper = {action: VariantStoreAction}
type ResponseWrapper = {response: SystemVariant[]}

const SORT_FIELD = '_createdAt'
const SORT_ORDER = 'desc'
// Newest variants first
const QUERY_SORT_ORDER = `order(${SORT_FIELD} ${SORT_ORDER})`
const QUERY_FILTER = `_type=="${VARIANT_DOCUMENT_TYPE}" && _id in path("${VARIANT_DOCUMENTS_PATH}.*")`
const QUERY_PROJECTION = `{
  _id,
  _type,
  _createdAt,
  conditions,
  "priority": coalesce(priority, 0),
  metadata,
}`

const QUERY = `*[${QUERY_FILTER}] ${QUERY_PROJECTION} | ${QUERY_SORT_ORDER}`

const INITIAL_STATE: VariantStoreState = {
  variants: new Map(),
  state: 'initialising' as const,
}

export interface VariantStore {
  state$: Observable<VariantStoreState>
  dispatch: Dispatch<VariantStoreAction>
}

/**
 * The variants store is initialised lazily when first subscribed to. Upon subscription, it will
 * fetch a list of variants and create a listener to keep the locally held state fresh.
 *
 * The store is not disposed of when all subscriptions are closed. After it has been initialised,
 * it will keep listening for the duration of the app's lifecycle. Subsequent subscriptions will be
 * given the latest state upon subscription.
 */
export function createVariantsStore(context: {client: SanityClient}): VariantStore {
  const {client} = context

  const dispatch$ = new Subject<VariantStoreAction>()
  const fetchPending$ = new BehaviorSubject<boolean>(false)

  function dispatch(action: VariantStoreAction): void {
    dispatch$.next(action)
  }

  const listFetch$ = of<ActionWrapper>({
    action: {
      type: 'LOADING_STATE_CHANGED',
      payload: {
        loading: true,
        error: undefined,
      },
    },
  }).pipe(
    // Ignore invocations while the list fetch is pending.
    filter(() => !fetchPending$.value),
    tap(() => fetchPending$.next(true)),
    concatWith(
      listenQuery(client, QUERY, {}, {tag: 'variants.listen'}).pipe(
        tap(() => fetchPending$.next(false)),
        map((variants) => ({response: variants})),
      ),
    ),

    catchError((error) =>
      of<ActionWrapper>({
        action: {
          type: 'LOADING_STATE_CHANGED',
          payload: {
            loading: false,
            error,
          },
        },
      }),
    ),
    switchMap<ActionWrapper | ResponseWrapper, Observable<VariantStoreAction | undefined>>(
      (entry) => {
        if ('action' in entry) {
          return of<VariantStoreAction>(entry.action)
        }

        return of<VariantStoreAction[]>(
          {type: 'VARIANTS_SET', payload: entry.response},
          {
            type: 'LOADING_STATE_CHANGED',
            payload: {
              loading: false,
              error: undefined,
            },
          },
        )
      },
    ),
  )

  const state$ = concat(merge(listFetch$, dispatch$)).pipe(
    filter((action): action is VariantStoreAction => typeof action !== 'undefined'),
    scan((state, action) => variantStoreReducer(state, action), INITIAL_STATE),
    startWith(INITIAL_STATE),
    shareReplay(1),
  )

  return {
    state$,
    dispatch,
  }
}
