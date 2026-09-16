import {assign, setup} from 'xstate'

import {RELEVANCE_ORDERING_ID} from './DocumentListPaneSearchOrdering'

/**
 * The pane search's interdependent state: what the editor typed, the query the
 * list actually searches on, the search-scoped sort ordering, and whether the
 * search spinner has been armed for the current pane.
 */
export interface DocumentListSearchContext {
  paneKey: string
  /** What the search input shows, echoed synchronously per keystroke. */
  inputValue: string
  /** The applied (debounced) query. May be whitespace-only; the list treats a blank trim as no search. */
  searchQuery: string
  /** The search-scoped ordering. Resets to relevance whenever the search clears. */
  orderingId: string
  /**
   * The spinner only shows once the list has settled at least once for the
   * current pane, so pane mounts don't flash it. Re-armed after 'pane changed'.
   */
  spinnerEnabled: boolean
}

export type DocumentListSearchEvent =
  | {type: 'input changed'; value: string}
  | {type: 'pane changed'; paneKey: string}
  | {type: 'ordering selected'; orderingId: string}
  | {type: 'list settled'}

export interface DocumentListSearchInput {
  paneKey: string
}

const DEBOUNCE_MS = 300

/**
 * Models the document list pane's search box. States:
 *
 * - `idle`: no effective search term. Entering it resets the ordering to
 *   relevance, which covers clearing, Escape, whitespace-only queries, and
 *   pane changes with one rule.
 * - `debouncing`: the editor is typing; the previously applied query stays
 *   active until the timer fires. Clearing skips the debounce.
 * - `active`: a trimmed, non-empty query is applied.
 *
 * External facts arrive as events: `pane changed` atomically resets input,
 * query, ordering, and spinner arming; `list settled` arms the spinner.
 * Everything the component previously coordinated through three effects and
 * three `useState`s is a transition here, so invalid combinations (a stale
 * ordering on a cleared search, a spinner armed for the previous pane) are
 * unrepresentable.
 */
export const documentListSearchMachine = setup({
  types: {} as {
    context: DocumentListSearchContext
    events: DocumentListSearchEvent
    input: DocumentListSearchInput
  },
  guards: {
    'is cleared': ({event}) => event.type === 'input changed' && event.value === '',
    'has search term': ({context}) => context.inputValue.trim() !== '',
    'is other pane': ({context, event}) =>
      event.type === 'pane changed' && event.paneKey !== context.paneKey,
  },
  actions: {
    'assign input': assign({
      inputValue: ({event}) => (event.type === 'input changed' ? event.value : ''),
    }),
    'clear search': assign({inputValue: '', searchQuery: ''}),
    'apply query': assign({searchQuery: ({context}) => context.inputValue}),
    'reset ordering': assign({orderingId: RELEVANCE_ORDERING_ID}),
  },
}).createMachine({
  context: ({input}) => ({
    paneKey: input.paneKey,
    inputValue: '',
    searchQuery: '',
    orderingId: RELEVANCE_ORDERING_ID,
    spinnerEnabled: false,
  }),
  initial: 'idle',
  on: {
    'input changed': [
      {guard: 'is cleared', target: '.idle', actions: 'clear search'},
      {target: '.debouncing', actions: 'assign input'},
    ],
    'pane changed': {
      guard: 'is other pane',
      target: '.idle',
      actions: assign({
        paneKey: ({event}) => (event.type === 'pane changed' ? event.paneKey : ''),
        inputValue: '',
        searchQuery: '',
        spinnerEnabled: false,
      }),
    },
    'ordering selected': {
      actions: assign({
        orderingId: ({event}) => (event.type === 'ordering selected' ? event.orderingId : ''),
      }),
    },
    'list settled': {
      actions: assign({spinnerEnabled: true}),
    },
  },
  states: {
    idle: {
      entry: 'reset ordering',
    },
    debouncing: {
      on: {
        'input changed': [
          {guard: 'is cleared', target: 'idle', actions: 'clear search'},
          {target: 'debouncing', reenter: true, actions: 'assign input'},
        ],
      },
      after: {
        [DEBOUNCE_MS]: [
          {guard: 'has search term', target: 'active', actions: 'apply query'},
          {target: 'idle', actions: 'apply query'},
        ],
      },
    },
    active: {},
  },
})
