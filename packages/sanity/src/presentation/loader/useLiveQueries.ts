import {type ClientPerspective} from '@sanity/client'
import isEqual from 'fast-deep-equal'
import {useDeferredValue, useEffect, useReducer} from 'react'
import {type QueryParams} from 'sanity'

import {LOADER_QUERY_GC_INTERVAL} from '../constants'
import {getQueryCacheKey, type QueryCacheKey} from './utils'

type LiveQueriesState = Map<
  QueryCacheKey,
  {
    query: string
    params: QueryParams
    perspective: ClientPerspective
  }
>

type State = {
  queries: LiveQueriesState
  heartbeats: Map<
    QueryCacheKey,
    {
      receivedAt: number
      /**
       * If false it means the query can't safely be garbage collected,
       * as older versions of \@sanity/core-loader doesn't fire listen events
       * on an interval.
       */
      heartbeat: number | false
    }
  >
}

type QueryListenAction = {
  type: 'query-listen'
  payload: {
    perspective: ClientPerspective
    query: string
    params: QueryParams
    heartbeat: number | false
  }
}
type GarbageCollectAction = {type: 'gc'}
type Action = QueryListenAction | GarbageCollectAction

function gc(state: State): State {
  if (state.queries.size < 1) {
    return state
  }

  const now = Date.now()
  const hasAnyExpired = Array.from(state.heartbeats.values()).some(
    (entry) => entry.heartbeat !== false && now > entry.receivedAt + entry.heartbeat,
  )
  if (!hasAnyExpired) {
    return state
  }
  const nextHeartbeats = new Map()
  const nextQueries = new Map()
  for (const [key, entry] of state.heartbeats.entries()) {
    if (entry.heartbeat !== false && now > entry.receivedAt + entry.heartbeat) {
      continue
    }
    nextHeartbeats.set(key, entry)
    nextQueries.set(key, state.queries.get(key))
  }

  return {...state, queries: nextQueries, heartbeats: nextHeartbeats}
}
function queryListen(state: State, {payload}: QueryListenAction): State {
  const key = getQueryCacheKey(payload.perspective, payload.query, payload.params)
  const data = {query: payload.query, params: payload.params, perspective: payload.perspective}

  const nextHeartbeats = new Map(state.heartbeats)
  nextHeartbeats.set(key, {
    receivedAt: Date.now(),
    heartbeat: payload.heartbeat,
  })

  let nextQueries = state.queries
  /**
   * The data comes from a postMessage event, which uses the structured clone algorithm to serialize state (https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage#message).
   * This impacts `params`, which is an object, as it will be a new object every time even if the sender is sending the same object instance on their end.
   * It also impacts `perspective`, as it's no longer just a string, but can also be an array of strings.
   * Both cases are handled by fast-deep-equal, which is used to compare the data before deciding wether the state should be updated.
   */
  if (!state.queries.has(key) || !isEqual(state.queries.get(key), data)) {
    nextQueries = new Map(state.queries)
    nextQueries.set(key, data)
  }

  return {heartbeats: nextHeartbeats, queries: nextQueries}
}

export function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'query-listen':
      return queryListen(state, action)
    case 'gc':
      return gc(state)
    default:
      throw Error(
        `Unknown action: ${
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (action as any).type
        }`,
        {cause: action},
      )
  }
}

export const initialState: State = {
  queries: new Map(),
  heartbeats: new Map(),
}

export function useLiveQueries(): [LiveQueriesState, React.ActionDispatch<[action: Action]>] {
  const [state, dispatch] = useReducer(reducer, initialState)

  useEffect(() => {
    const interval = setInterval(() => dispatch({type: 'gc'}), LOADER_QUERY_GC_INTERVAL)
    return () => clearInterval(interval)
  }, [])

  const queries = useDeferredValue(state.queries)
  return [queries, dispatch]
}
