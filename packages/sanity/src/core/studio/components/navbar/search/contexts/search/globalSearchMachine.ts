import {type Schema, type SchemaType, type SearchStrategy} from '@sanity/types'
import {dequal} from 'dequal/lite'
import {throwError} from 'rxjs'
import {
  type ActorRefFrom,
  assign,
  enqueueActions,
  fromObservable,
  setup,
  type SnapshotFrom,
} from 'xstate'

import {isEqualSearchTerms} from '../../../../../../search/common/isEqualSearchTerms'
import {
  type Groq2024SearchResults,
  type SearchHit,
  type SearchTerms,
  type WeightedSearchResults,
} from '../../../../../../search/common/types'
import {removeDupes} from '../../../../../../util/draftUtils'
import {isNonNullable} from '../../../../../../util/isNonNullable'
import {type GlobalSearchLatencyMeasuredData} from '../../__telemetry__/search.telemetry'
import {SEARCH_LIMIT} from '../../constants'
import {type RecentSearch} from '../../datastores/recentSearches'
import {type SearchFieldDefinitionDictionary} from '../../definitions/fields'
import {type SearchFilterDefinitionDictionary} from '../../definitions/filters'
import {getOrderings} from '../../definitions/getOrderings'
import {
  getOperatorDefinition,
  getOperatorInitialValue,
  type SearchOperatorDefinitionDictionary,
} from '../../definitions/operators'
import {type SearchFilter, type SearchOrdering} from '../../types'
import {
  generateFilterQuery,
  getFieldFromFilter,
  getFilterKey,
  narrowDocumentTypes,
  validateFilter,
} from '../../utils/filterUtils'
import {hasSearchableTerms} from '../../utils/hasSearchableTerms'
import {isRecentSearchTerms} from '../../utils/isRecentSearchTerms'
import {
  isEqualSearchRequest,
  sanitizeSearchRequest,
  type SearchRequest,
} from '../../utils/searchRequest'
import {sortTypes} from '../../utils/selectors'

/**
 * @internal
 */
export interface SearchDefinitions {
  fields: SearchFieldDefinitionDictionary
  filters: SearchFilterDefinitionDictionary
  operators: SearchOperatorDefinitionDictionary
}

/**
 * @internal
 */
export interface SearchResult {
  error: Error | null
  /** Whether `hits` belong to the current terms, so the next page is appended to them. */
  hasLocal: boolean
  hits: SearchHit[]
  loaded: boolean
  loading: boolean
}

/**
 * @internal
 */
export type GlobalSearchResults = WeightedSearchResults | Groq2024SearchResults

interface SearchStarted {
  at: number
  queryLength: number
  typeFilterCount: number
}

/**
 * @internal
 */
export interface GlobalSearchMachineContext {
  schema: Schema
  definitions: SearchDefinitions
  strategy?: SearchStrategy
  debug: boolean

  terms: RecentSearch | SearchTerms
  filters: SearchFilter[]
  documentTypesNarrowed: string[]
  lastAddedFilter: SearchFilter | null
  ordering: SearchOrdering
  cursor: string | null
  nextCursor: string | null
  result: SearchResult

  filtersVisible: boolean
  /** Top index of the results list when the search last closed, restored when it reopens. */
  lastActiveIndex: number

  /** The last accepted search request, whether debouncing, in flight or settled. */
  request: SearchRequest | null
  /** Set while a search with searchable terms is in flight, for latency telemetry. */
  searchStarted: SearchStarted | null
}

/**
 * @internal
 */
export type GlobalSearchEvent =
  | {type: 'FILTERS_VISIBLE_SET'; visible: boolean}
  | {type: 'LAST_ACTIVE_INDEX_SET'; index: number}
  | {type: 'ORDERING_RESET'}
  | {type: 'ORDERING_SET'; ordering: SearchOrdering}
  | {type: 'PAGE_INCREMENT'}
  | {type: 'SEARCH_CLOSED'}
  | {type: 'SEARCH_OPENED'}
  /** Raised by the machine itself whenever the search request changes. */
  | {type: 'SEARCH_REQUESTED'}
  | {type: 'TERMS_FILTERS_ADD'; filter: SearchFilter}
  | {type: 'TERMS_FILTERS_CLEAR'}
  | {type: 'TERMS_FILTERS_REMOVE'; filterKey: string}
  | {type: 'TERMS_FILTERS_SET_OPERATOR'; filterKey: string; operatorType: string}
  | {type: 'TERMS_FILTERS_SET_VALUE'; filterKey: string; value?: unknown}
  | {type: 'TERMS_QUERY_SET'; query: string}
  | {type: 'TERMS_SET'; filters?: SearchFilter[]; terms: SearchTerms}
  | {type: 'TERMS_TYPE_ADD'; schemaType: SchemaType}
  | {type: 'TERMS_TYPE_REMOVE'; schemaType: SchemaType}
  | {type: 'TERMS_TYPES_CLEAR'}

/**
 * @internal
 */
export interface GlobalSearchMachineInput {
  schema: Schema
  definitions: SearchDefinitions
  strategy?: SearchStrategy
  debug?: boolean
}

type ContextUpdate = Partial<GlobalSearchMachineContext>

export const SEARCH_DEBOUNCE_MS = 300

/**
 * Strips `__recent` from terms whenever something other than clicking a recent search changes
 * them, so requests sent as a result of clicking a recent search can be told apart in the
 * `findability-recent-search` measurement comment.
 */
// @todo: remove this (and associated tests) once client-side instrumentation is available
function stripRecent(terms: RecentSearch | SearchTerms): SearchTerms {
  if (isRecentSearchTerms(terms)) {
    const {__recent, ...rest} = terms
    return rest
  }
  return terms
}

function toFilterQuery(definitions: SearchDefinitions, filters: SearchFilter[]): string {
  return generateFilterQuery({
    fieldDefinitions: definitions.fields,
    filterDefinitions: definitions.filters,
    filters,
    operatorDefinitions: definitions.operators,
  })
}

function narrowTypes(
  definitions: SearchDefinitions,
  filters: SearchFilter[],
  types: SchemaType[],
): string[] {
  return narrowDocumentTypes({fieldDefinitions: definitions.fields, filters, types})
}

function isCompleteFilter(definitions: SearchDefinitions, filter: SearchFilter): boolean {
  return validateFilter({
    fieldDefinitions: definitions.fields,
    filter,
    filterDefinitions: definitions.filters,
    operatorDefinitions: definitions.operators,
  })
}

function setOrdering(context: GlobalSearchMachineContext, ordering: SearchOrdering): ContextUpdate {
  return {
    ordering,
    terms: stripRecent(context.terms),
    cursor: null,
    nextCursor: null,
    result: {...context.result, hasLocal: false},
  }
}

function resetOrdering(context: GlobalSearchMachineContext): ContextUpdate {
  return setOrdering(context, getOrderings({searchStrategy: context.strategy}).relevance)
}

function incrementPage(context: GlobalSearchMachineContext): ContextUpdate {
  return {
    cursor: context.nextCursor ?? context.cursor,
    nextCursor: null,
    terms: stripRecent(context.terms),
  }
}

/** Replaces the filters without re-narrowing document types, for changes that keep the field. */
function setFilterQuery(
  context: GlobalSearchMachineContext,
  filters: SearchFilter[],
): ContextUpdate {
  return {
    filters,
    cursor: null,
    nextCursor: null,
    terms: {...context.terms, filter: toFilterQuery(context.definitions, filters)},
    result: {...context.result, hasLocal: false},
  }
}

function setFilters(context: GlobalSearchMachineContext, filters: SearchFilter[]): ContextUpdate {
  return {
    ...setFilterQuery(context, filters),
    documentTypesNarrowed: narrowTypes(context.definitions, filters, context.terms.types),
  }
}

function addFilter(context: GlobalSearchMachineContext, filter: SearchFilter): ContextUpdate {
  const newFilter: SearchFilter = {
    ...filter,
    value: getOperatorInitialValue(context.definitions.operators, filter.operatorType),
  }
  return {
    ...setFilters(context, [...context.filters, newFilter]),
    lastAddedFilter: newFilter,
  }
}

function removeFilter(context: GlobalSearchMachineContext, filterKey: string): ContextUpdate {
  return setFilters(
    context,
    context.filters.filter((filter) => getFilterKey(filter) !== filterKey),
  )
}

function setFilterOperator(
  context: GlobalSearchMachineContext,
  filterKey: string,
  operatorType: string,
): ContextUpdate {
  // Reset the value when the operator uses a different input component, as the current value
  // won't fit it.
  const matchedFilter = context.filters.find((filter) => getFilterKey(filter) === filterKey)
  const currentOperator = getOperatorDefinition(
    context.definitions.operators,
    matchedFilter?.operatorType,
  )
  const nextOperator = getOperatorDefinition(context.definitions.operators, operatorType)
  const inputComponentChanged = currentOperator?.inputComponent != nextOperator?.inputComponent

  return setFilterQuery(
    context,
    context.filters.map((filter) =>
      getFilterKey(filter) === filterKey
        ? {
            ...filter,
            operatorType,
            ...(inputComponentChanged ? {value: nextOperator?.initialValue} : {}),
          }
        : filter,
    ),
  )
}

function setFilterValue(
  context: GlobalSearchMachineContext,
  filterKey: string,
  value: unknown,
): ContextUpdate {
  return setFilterQuery(
    context,
    context.filters.map((filter) =>
      getFilterKey(filter) === filterKey ? {...filter, value} : filter,
    ),
  )
}

function setQuery(context: GlobalSearchMachineContext, query: string): ContextUpdate {
  return {
    cursor: null,
    nextCursor: null,
    result: {...context.result, loaded: false, hasLocal: false},
    terms: stripRecent({...context.terms, query}),
  }
}

function setTerms(
  context: GlobalSearchMachineContext,
  terms: SearchTerms,
  filters: SearchFilter[] = [],
): ContextUpdate {
  const types = [...context.terms.types, ...terms.types].sort(sortTypes)
  return {
    documentTypesNarrowed: narrowTypes(context.definitions, filters, types),
    filters,
    lastAddedFilter: null,
    cursor: null,
    nextCursor: null,
    result: {...context.result, loaded: false, hasLocal: false},
    terms: {...terms, filter: toFilterQuery(context.definitions, filters)},
  }
}

function addType(context: GlobalSearchMachineContext, schemaType: SchemaType): ContextUpdate {
  const types = [...context.terms.types, schemaType].sort(sortTypes)

  // Narrow on the selected types alone, then drop field filters that don't apply to every
  // narrowed type. Filters on fields shared by all types, and non-field filters, always apply.
  const documentTypesNarrowed = narrowTypes(context.definitions, [], types)
  const filters = context.filters.filter((filter) => {
    const fieldDefinition = getFieldFromFilter(context.definitions.fields, filter)
    if (!fieldDefinition || fieldDefinition.documentTypes.length === 0) {
      return true
    }
    return documentTypesNarrowed.every((type) => fieldDefinition.documentTypes.includes(type))
  })

  return {
    documentTypesNarrowed,
    filters,
    cursor: null,
    nextCursor: null,
    result: {...context.result, loaded: false, hasLocal: false},
    terms: stripRecent({
      ...context.terms,
      filter: toFilterQuery(context.definitions, filters),
      types,
    }),
  }
}

function setTypes(context: GlobalSearchMachineContext, types: SchemaType[]): ContextUpdate {
  return {
    documentTypesNarrowed: narrowTypes(context.definitions, context.filters, types),
    cursor: null,
    nextCursor: null,
    result: {...context.result, loaded: false, hasLocal: false},
    terms: stripRecent({...context.terms, types}),
  }
}

function startSearch(context: GlobalSearchMachineContext): ContextUpdate {
  const {terms} = context
  return {
    result: {...context.result, loaded: false, loading: true},
    searchStarted: hasSearchableTerms({terms})
      ? {
          at: performance.now(),
          queryLength: terms.query.length,
          typeFilterCount: terms.types.length,
        }
      : null,
  }
}

function completeSearch(
  context: GlobalSearchMachineContext,
  {hits, nextCursor}: {hits: SearchHit[]; nextCursor?: string},
): ContextUpdate {
  return {
    nextCursor: nextCursor ?? null,
    result: {
      error: null,
      hasLocal: true,
      hits: removeDupes(
        [...(context.result.hasLocal ? context.result.hits : []), ...hits].map(({hit}) => hit),
      ).map((hit) => ({hit})),
      loaded: true,
      loading: false,
    },
    searchStarted: null,
  }
}

function failSearch(context: GlobalSearchMachineContext, error: unknown): ContextUpdate {
  return {
    result: {
      ...context.result,
      error: error instanceof Error ? error : new Error(String(error)),
      loaded: false,
      loading: false,
    },
    searchStarted: null,
  }
}

function getSearchLatency(
  context: GlobalSearchMachineContext,
  outcome: {resultCount: number; errored: boolean},
): GlobalSearchLatencyMeasuredData | null {
  const {searchStarted, strategy} = context
  if (!searchStarted) {
    return null
  }
  return {
    durationMs: performance.now() - searchStarted.at,
    queryLength: searchStarted.queryLength,
    typeFilterCount: searchStarted.typeFilterCount,
    resultCount: outcome.resultCount,
    strategy: strategy ?? null,
    errored: outcome.errored,
  }
}

/**
 * Rules that must hold after every change:
 * - Unsearchable terms can't show results, so their hits and pagination are dropped.
 * - The results list starts at the top again once a search settles, or when the terms become
 *   unsearchable and recent searches are shown instead.
 */
function applySearchRules(
  prev: GlobalSearchMachineContext,
  next: GlobalSearchMachineContext,
): GlobalSearchMachineContext {
  const hasValidTerms = hasSearchableTerms({terms: next.terms})
  let context = next

  if (!hasValidTerms && context.result.hits.length > 0) {
    context = {
      ...context,
      cursor: null,
      nextCursor: null,
      result: {...context.result, hasLocal: false, hits: []},
    }
  }

  const validityChanged = hasValidTerms !== hasSearchableTerms({terms: prev.terms})
  const loadedChanged = context.result.loaded !== prev.result.loaded
  if ((validityChanged || loadedChanged) && (!hasValidTerms || context.result.loaded)) {
    context = {...context, lastActiveIndex: 0}
  }

  return context
}

/**
 * Narrowed document types and the filter count are sent along with a request, but only a
 * change to the terms, the ordering or the page schedules one.
 */
function hasSearchRequestInputsChanged(
  prev: GlobalSearchMachineContext,
  next: GlobalSearchMachineContext,
): boolean {
  return (
    next.cursor !== prev.cursor ||
    !dequal(next.ordering, prev.ordering) ||
    !isEqualSearchTerms(next.terms, prev.terms)
  )
}

function createSearchRequest(context: GlobalSearchMachineContext): SearchRequest {
  const {cursor, definitions, documentTypesNarrowed, filters, ordering, schema, strategy, terms} =
    context

  let sortLabel = 'findability-sort:'
  if (ordering.customMeasurementLabel || ordering.sort) {
    // Use a custom label if provided, otherwise return field and direction, e.g. `_updatedAt desc`
    sortLabel +=
      ordering.customMeasurementLabel || `${ordering.sort?.field} ${ordering.sort?.direction}`
  }

  return sanitizeSearchRequest({
    options: {
      // Comments prepended to each query for future measurement
      comments: [
        ...(isRecentSearchTerms(terms)
          ? [`findability-recent-search:${terms.__recent.index}`]
          : []),
        `findability-selected-types:${terms.types.length}`,
        sortLabel,
        `findability-source: global`,
        `findability-filter-count:${filters.filter((filter) => isCompleteFilter(definitions, filter)).length}`,
      ],
      // `groq2024` supports pagination. Therefore, fetch fewer results.
      limit: strategy === 'groq2024' ? 25 : SEARCH_LIMIT,
      skipSortByScore: ordering.ignoreScore,
      ...(ordering.sort ? {sort: [ordering.sort]} : {}),
      cursor: cursor || undefined,
      perspective: 'raw',
    },
    terms: {
      ...terms,
      types: documentTypesNarrowed.map((typeName) => schema.get(typeName)).filter(isNonNullable),
    },
  })
}

/**
 * Global search state: the terms, filters, ordering and page being searched, the results, and
 * the search requests they cause. Two parallel regions:
 *
 * - `request` runs the searches: every change to the terms, ordering or page that alters the
 *   request (re)starts a debounce (`debouncing`), after which the request is searched
 *   (`searching`), or settles with no results when its terms are unsearchable. A new request
 *   exits `searching`, which cancels the in-flight search, and `result.loading` stays up
 *   through the following debounce.
 * - `visibility` follows the open state of the search surface: closing it with unsearchable
 *   terms resets the ordering to relevance.
 *
 * Every context change goes through the `update search` action, which also enforces the rules
 * in {@link applySearchRules} and schedules requests, in the same transition as the change that
 * caused them.
 *
 * Environment-bound behavior is provided by the consumer: the `search` actor, and the
 * `log search latency` action for telemetry.
 *
 * @internal
 */
export const globalSearchMachine = setup({
  types: {} as {
    context: GlobalSearchMachineContext
    events: GlobalSearchEvent
    input: GlobalSearchMachineInput
  },
  actors: {
    search: fromObservable<GlobalSearchResults, {request: SearchRequest}>(() =>
      throwError(
        () =>
          new Error(
            "The 'search' actor is not implemented. Add it to globalSearchMachine.provide({actors: {search: fromObservable(({input}) => ...)}})",
          ),
      ),
    ),
  },
  actions: {
    'update search': enqueueActions(({context, enqueue}, update: ContextUpdate) => {
      const next = applySearchRules(context, {...context, ...update})
      enqueue.assign(() => next)

      if (!hasSearchRequestInputsChanged(context, next)) {
        return
      }
      const request = createSearchRequest(next)
      if (isEqualSearchRequest(request, context.request)) {
        return
      }
      enqueue.assign({request: () => request})
      enqueue.raise({type: 'SEARCH_REQUESTED'})
    }),
    'log search latency': (_, _latency: GlobalSearchLatencyMeasuredData | null) => {},
  },
  guards: {
    'has searchable request': ({context}) =>
      context.request !== null && hasSearchableTerms({terms: context.request.terms}),
    'has unsearchable terms': ({context}) => !hasSearchableTerms({terms: context.terms}),
  },
  delays: {
    debounce: SEARCH_DEBOUNCE_MS,
  },
}).createMachine({
  id: 'globalSearch',
  type: 'parallel',
  context: ({input}) => ({
    schema: input.schema,
    definitions: input.definitions,
    strategy: input.strategy,
    debug: input.debug ?? false,
    terms: {query: '', types: []},
    filters: [],
    documentTypesNarrowed: [],
    lastAddedFilter: null,
    ordering: getOrderings({searchStrategy: input.strategy}).relevance,
    cursor: null,
    nextCursor: null,
    result: {error: null, hasLocal: false, hits: [], loaded: false, loading: false},
    filtersVisible: true,
    lastActiveIndex: -1,
    request: null,
    searchStarted: null,
  }),
  on: {
    FILTERS_VISIBLE_SET: {actions: assign({filtersVisible: ({event}) => event.visible})},
    LAST_ACTIVE_INDEX_SET: {actions: assign({lastActiveIndex: ({event}) => event.index})},
    ORDERING_RESET: {
      actions: {type: 'update search', params: ({context}) => resetOrdering(context)},
    },
    ORDERING_SET: {
      actions: {
        type: 'update search',
        params: ({context, event}) => setOrdering(context, event.ordering),
      },
    },
    PAGE_INCREMENT: {
      actions: {type: 'update search', params: ({context}) => incrementPage(context)},
    },
    TERMS_FILTERS_ADD: {
      actions: {
        type: 'update search',
        params: ({context, event}) => addFilter(context, event.filter),
      },
    },
    TERMS_FILTERS_CLEAR: {
      actions: {type: 'update search', params: ({context}) => setFilters(context, [])},
    },
    TERMS_FILTERS_REMOVE: {
      actions: {
        type: 'update search',
        params: ({context, event}) => removeFilter(context, event.filterKey),
      },
    },
    TERMS_FILTERS_SET_OPERATOR: {
      actions: {
        type: 'update search',
        params: ({context, event}) =>
          setFilterOperator(context, event.filterKey, event.operatorType),
      },
    },
    TERMS_FILTERS_SET_VALUE: {
      actions: {
        type: 'update search',
        params: ({context, event}) => setFilterValue(context, event.filterKey, event.value),
      },
    },
    TERMS_QUERY_SET: {
      actions: {
        type: 'update search',
        params: ({context, event}) => setQuery(context, event.query),
      },
    },
    TERMS_SET: {
      actions: {
        type: 'update search',
        params: ({context, event}) => setTerms(context, event.terms, event.filters),
      },
    },
    TERMS_TYPE_ADD: {
      actions: {
        type: 'update search',
        params: ({context, event}) => addType(context, event.schemaType),
      },
    },
    TERMS_TYPE_REMOVE: {
      actions: {
        type: 'update search',
        params: ({context, event}) =>
          setTypes(
            context,
            context.terms.types.filter((type) => type !== event.schemaType),
          ),
      },
    },
    TERMS_TYPES_CLEAR: {
      actions: {type: 'update search', params: ({context}) => setTypes(context, [])},
    },
  },
  states: {
    request: {
      initial: 'idle',
      states: {
        idle: {
          on: {SEARCH_REQUESTED: 'debouncing'},
        },
        debouncing: {
          on: {SEARCH_REQUESTED: {target: 'debouncing', reenter: true}},
          after: {
            debounce: [
              {guard: 'has searchable request', target: 'searching'},
              {
                target: 'idle',
                actions: {
                  type: 'update search',
                  params: ({context}) => completeSearch(context, {hits: []}),
                },
              },
            ],
          },
        },
        searching: {
          on: {SEARCH_REQUESTED: 'debouncing'},
          entry: {type: 'update search', params: ({context}) => startSearch(context)},
          invoke: {
            src: 'search',
            input: ({context}) => ({request: context.request!}),
            onSnapshot: {
              // `fromObservable` snapshots hold the latest emission, `undefined` until the first
              guard: ({event}) => event.snapshot.context !== undefined,
              target: 'idle',
              actions: [
                {
                  type: 'log search latency',
                  params: ({context, event}) =>
                    getSearchLatency(context, {
                      resultCount: event.snapshot.context?.hits.length ?? 0,
                      errored: false,
                    }),
                },
                {
                  type: 'update search',
                  params: ({context, event}) =>
                    completeSearch(context, event.snapshot.context ?? {hits: []}),
                },
              ],
            },
            onError: {
              target: 'idle',
              actions: [
                {
                  type: 'log search latency',
                  params: ({context}) => getSearchLatency(context, {resultCount: 0, errored: true}),
                },
                {
                  type: 'update search',
                  params: ({context, event}) => failSearch(context, event.error),
                },
              ],
            },
          },
        },
      },
    },
    visibility: {
      initial: 'closed',
      states: {
        closed: {
          on: {SEARCH_OPENED: 'open'},
        },
        open: {
          on: {
            SEARCH_CLOSED: [
              {
                guard: 'has unsearchable terms',
                target: 'closed',
                actions: {type: 'update search', params: ({context}) => resetOrdering(context)},
              },
              {target: 'closed'},
            ],
          },
        },
      },
    },
  },
})

/**
 * @internal
 */
export type GlobalSearchActorRef = ActorRefFrom<typeof globalSearchMachine>

/**
 * @internal
 */
export type GlobalSearchSnapshot = SnapshotFrom<typeof globalSearchMachine>
