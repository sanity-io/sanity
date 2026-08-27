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
 * only the latest query's result can ever land. Consumers parameterize
 * behavior through implementations rather than configuration:
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
              "The 'search' actor is not implemented. Add it to searchMachine.provide({actors: {search: fromObservable(({input}) => ...)}})",
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
      settledQuery: null,
    }),
    initial: 'idle',
    on: {
      search: [
        {guard: 'is same query'},
        {target: '.debouncing', actions: assign({query: ({event}) => event.query})},
      ],
    },
    states: {
      idle: {},
      debouncing: {
        after: {
          debounce: [{guard: 'should search', target: 'searching'}, {target: 'skipped'}],
        },
      },
      searching: {
        entry: [assign({error: null}), emit({type: 'search started'})],
        invoke: {
          src: 'search',
          input: ({context}) => ({query: context.query as TQuery}),
          onSnapshot: {
            actions: assign({
              result: ({context, event}) =>
                event.snapshot.context === undefined ? context.result : event.snapshot.context,
            }),
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
      },
      success: {
        entry: [
          assign({settledQuery: ({context}) => context.query}),
          // The search actor emits at least once before completing, so
          // `result` is set by the time this state is entered.
          emit(({context}) => ({type: 'search completed', result: context.result as TResult})),
        ],
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
