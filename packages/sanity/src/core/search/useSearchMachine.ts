import {shallowEqual, useActorRef, useSelector} from '@xstate/react'
import {useCallback, useEffect, useState} from 'react'
import {type Observable} from 'rxjs'
import {useEffectEvent} from 'use-effect-event'
import {fromObservable} from 'xstate'

import {defineSearchMachine} from './searchMachine'

/**
 * @internal
 * @hidden
 */
export interface SearchMachineState<THit> {
  hits: THit[]
  isLoading: boolean
  searchString?: string
}

/**
 * @internal
 * @hidden
 */
export interface UseSearchMachineOptions<THit> {
  search: (query: string) => Observable<THit[]>
  /** Swallow a query identical to the previously accepted one. */
  distinct?: boolean
  debounceMs?: number
  onSearchFailed?: (error: Error) => void
}

const EMPTY_HITS: never[] = []

/**
 * Binds {@link defineSearchMachine} to the string-query search inputs.
 *
 * `search` and `onSearchFailed` may change identity every render: provided
 * actor implementations are kept render-fresh by `@xstate/react`, and the
 * failure callback is read through an effect event.
 *
 * @internal
 * @hidden
 */
export function useSearchMachine<THit>(options: UseSearchMachineOptions<THit>): {
  searchState: SearchMachineState<THit>
  handleQueryChange: (query: string | null) => void
} {
  const {search, distinct = false, debounceMs = 0, onSearchFailed} = options

  const [machine] = useState(() => defineSearchMachine<string, THit[]>())

  const actorRef = useActorRef(
    machine.provide({
      actors: {search: fromObservable(({input}) => search(input.query))},
      guards: {
        'is same query': ({context, event}) => distinct && context.query === event.query,
      },
    }),
    {input: {debounceMs}},
  )

  const handleSearchFailed = useEffectEvent((error: Error) => onSearchFailed?.(error))
  useEffect(() => {
    const subscription = actorRef.on('search failed', (event) => handleSearchFailed(event.error))
    return () => subscription.unsubscribe()
    // oxlint-disable-next-line react/exhaustive-effect-dependencies -- use-effect-event handlers are stable, and react-hooks/exhaustive-deps requires excluding them
  }, [actorRef])

  const handleQueryChange = useCallback(
    (query: string | null) => {
      if (query === null) return
      actorRef.send({type: 'search', query})
    },
    [actorRef],
  )

  const searchState = useSelector(
    actorRef,
    (state): SearchMachineState<THit> => ({
      hits: state.context.result ?? EMPTY_HITS,
      isLoading: state.matches('debouncing') || state.matches({searching: 'pending'}),
      searchString: state.context.settledQuery ?? undefined,
    }),
    shallowEqual,
  )

  return {searchState, handleQueryChange}
}
