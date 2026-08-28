import {throwError} from 'rxjs'
import {assign, emit, fromObservable, setup} from 'xstate'

/**
 * @internal
 * @hidden
 */
export interface SearchMachineContext<TQuery, TResult> {
  debounceMs: number
  error: Error | null
  query: TQuery | null
  result: TResult | null
  /** Whether the currently debounced query interrupted a running search. */
  searchInterrupted: boolean
  /** The query of the last search that settled (succeeded, failed, or was skipped). */
  settledQuery: TQuery | null
}

/**
 * @internal
 * @hidden
 */
export type SearchMachineEvent<TQuery> = {type: 'search'; query: TQuery}

/**
 * @internal
 * @hidden
 */
export type SearchMachineEmitted<TResult> =
  | {type: 'search started'}
  | {type: 'search completed'; result: TResult}
  | {type: 'search failed'; error: Error}
  | {type: 'search skipped'}

/**
 * @internal
 * @hidden
 */
export interface SearchMachineInput {
  debounceMs?: number
}

/**
 * A state machine for query-driven searches: accept a query, optionally
 * dedupe and debounce it, run one search at a time, and expose the outcome.
 *
 * Cancellation is structural: a new `search` event exits the `searching`
 * state, which stops the invoked actor and unsubscribes its observable, so
 * only the latest query's result can ever land. Search observables do not
 * have to complete: the first emission moves `searching.pending` to
 * `searching.streaming` while the subscription stays open, so live sources
 * keep updating `result` until the next query replaces them. Consumers
 * parameterize behavior through implementations rather than configuration:
 *
 * - `search` (actor): the fetch, given `{query}`. Provided per consumer, and
 *   `@xstate/react` keeps provided implementations render-fresh, so closures
 *   over props such as `onSearch` always call the latest render's version.
 * - `is same query` (guard): when true, the event is swallowed. Defaults to
 *   never, which matches consumers without `distinctUntilChanged` semantics.
 * - `should search` (guard): gates the fetch after the debounce. When false
 *   the machine reports `skipped` instead of invoking the actor.
 * - `debounce` (delay): defaults to `debounceMs` from input; consumers with
 *   per-event debounce read it from context.
 *
 * @internal
 * @hidden
 */
export function defineSearchMachine<TQuery, TResult>() {
  return setup({
    types: {} as {
      context: SearchMachineContext<TQuery, TResult>
      events: SearchMachineEvent<TQuery>
      emitted: SearchMachineEmitted<TResult>
      input: SearchMachineInput
    },
    actors: {
      search: fromObservable<TResult, {query: TQuery}>(() =>
        throwError(
          () =>
            new Error(
              "The 'search' actor is not implemented. Add it to defineSearchMachine().provide({actors: {search: fromObservable(({input}) => ...)}})",
            ),
        ),
      ),
    },
    guards: {
      'is same query': () => false,
      'should search': () => true,
    },
    delays: {
      debounce: ({context}) => context.debounceMs,
    },
  }).createMachine({
    context: ({input}) => ({
      debounceMs: input.debounceMs ?? 0,
      error: null,
      query: null,
      result: null,
      searchInterrupted: false,
      settledQuery: null,
    }),
    initial: 'idle',
    on: {
      search: [
        {guard: 'is same query'},
        {
          target: '.debouncing',
          actions: assign({query: ({event}) => event.query, searchInterrupted: false}),
        },
      ],
    },
    states: {
      idle: {},
      debouncing: {
        // Overrides the root transition to preserve `searchInterrupted`:
        // follow-up keystrokes inside the window still owe their existence to
        // the same cancelled search. `reenter` restarts the debounce timer.
        on: {
          search: [
            {guard: 'is same query'},
            {
              target: 'debouncing',
              reenter: true,
              actions: assign({query: ({event}) => event.query}),
            },
          ],
        },
        after: {
          debounce: [
            {guard: 'should search', target: 'searching', actions: emit({type: 'search started'})},
            {target: 'skipped', actions: emit({type: 'search started'})},
          ],
        },
      },
      searching: {
        // Overrides the root transition so consumers can tell a debounce that
        // interrupted a running search apart from one following a settled one:
        // the old pipelines kept reporting loading through the former.
        on: {
          search: [
            {guard: 'is same query'},
            {
              target: 'debouncing',
              actions: assign({query: ({event}) => event.query, searchInterrupted: true}),
            },
          ],
        },
        entry: assign({error: null}),
        // The invoke lives on this compound state rather than a child so that
        // long-lived search observables (e.g. reference search, which streams
        // live published-state updates and never completes) keep feeding
        // `result` after the first emission moves us to `streaming`.
        invoke: {
          src: 'search',
          input: ({context}) => ({query: context.query as TQuery}),
          onSnapshot: {
            // `fromObservable` snapshots hold the latest emission in `context`,
            // `undefined` until the first one — so a search observable must not
            // emit `undefined` as a result value.
            guard: ({event}) => event.snapshot.context !== undefined,
            target: '.streaming',
            actions: [
              assign({
                result: ({event}) => event.snapshot.context as TResult,
                settledQuery: ({context}) => context.query,
              }),
              emit(({event}) => ({
                type: 'search completed',
                result: event.snapshot.context as TResult,
              })),
            ],
          },
          onDone: {target: 'success'},
          onError: {
            target: 'failure',
            actions: assign({
              error: ({event}) =>
                event.error instanceof Error ? event.error : new Error(String(event.error)),
              result: null,
            }),
          },
        },
        initial: 'pending',
        states: {
          pending: {},
          streaming: {},
        },
      },
      success: {
        entry: assign({settledQuery: ({context}) => context.query}),
      },
      failure: {
        entry: [
          assign({settledQuery: ({context}) => context.query}),
          emit(({context}) => ({type: 'search failed', error: context.error as Error})),
        ],
      },
      skipped: {
        entry: [
          assign({settledQuery: ({context}) => context.query, result: null}),
          emit({type: 'search skipped'}),
        ],
      },
    },
  })
}
