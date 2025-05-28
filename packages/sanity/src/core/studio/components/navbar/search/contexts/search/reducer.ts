import {type CurrentUser, type SchemaType, type SearchStrategy} from '@sanity/types'

import {type SearchHit, type SearchTerms} from '../../../../../../search'
import {removeDupes} from '../../../../../../util/draftUtils'
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
import {debugWithName, isDebugMode} from '../../utils/debug'
import {
  generateFilterQuery,
  getFieldFromFilter,
  getFilterKey,
  narrowDocumentTypes,
} from '../../utils/filterUtils'
import {isRecentSearchTerms} from '../../utils/isRecentSearchTerms'
import {sortTypes} from '../../utils/selectors'

interface PaginationState {
  cursor: string | null
  nextCursor: string | null
}

export type SearchReducerState = PaginationState & {
  currentUser: CurrentUser | null
  debug: boolean
  definitions: SearchDefinitions
  documentTypesNarrowed: string[]
  filters: SearchFilter[]
  filtersVisible: boolean
  fullscreen?: boolean
  lastAddedFilter?: SearchFilter | null
  lastActiveIndex: number
  ordering: SearchOrdering
  result: SearchResult
  terms: RecentSearch | SearchTerms
  strategy?: SearchStrategy
  disabledDocumentIds?: string[]
  canDisableAction?: boolean
}

export interface SearchDefinitions {
  fields: SearchFieldDefinitionDictionary
  filters: SearchFilterDefinitionDictionary
  operators: SearchOperatorDefinitionDictionary
}

export interface SearchResult {
  error: Error | null
  hasLocal: boolean
  hits: SearchHit[]
  loaded: boolean
  loading: boolean
}

export interface InitialSearchState {
  currentUser: CurrentUser | null
  fullscreen?: boolean
  definitions: SearchDefinitions
  pagination: PaginationState
  strategy?: SearchStrategy
}

export function initialSearchState({
  currentUser,
  fullscreen,
  definitions,
  pagination,
  strategy,
}: InitialSearchState): SearchReducerState {
  return {
    currentUser,
    debug: isDebugMode(),
    documentTypesNarrowed: [],
    filters: [],
    filtersVisible: true,
    fullscreen,
    lastActiveIndex: -1,
    ordering: getOrderings({searchStrategy: strategy}).relevance,
    ...pagination,
    result: {
      error: null,
      hasLocal: false,
      hits: [],
      loaded: false,
      loading: false,
    },
    terms: {
      query: '',
      types: [],
    },
    definitions,
    strategy,
  }
}

export type FiltersVisibleSet = {type: 'FILTERS_VISIBLE_SET'; visible: boolean}
export type LastActiveIndexSet = {type: 'LAST_ACTIVE_INDEX_SET'; index: number}
export type PageIncrement = {type: 'PAGE_INCREMENT'}
export type OrderingReset = {type: 'ORDERING_RESET'}
export type OrderingSet = {ordering: SearchOrdering; type: 'ORDERING_SET'}
export type SearchClear = {type: 'SEARCH_CLEAR'}
export type SearchRequestComplete = {
  type: 'SEARCH_REQUEST_COMPLETE'
  hits: SearchHit[]
  nextCursor: string | undefined
}
export type SearchRequestError = {type: 'SEARCH_REQUEST_ERROR'; error: Error}
export type SearchRequestStart = {type: 'SEARCH_REQUEST_START'}
export type TermsFiltersAdd = {filter: SearchFilter; type: 'TERMS_FILTERS_ADD'}
export type TermsFiltersClear = {type: 'TERMS_FILTERS_CLEAR'}
export type TermsFiltersRemove = {filterKey: string; type: 'TERMS_FILTERS_REMOVE'}
export type TermsFiltersSetOperator = {
  filterKey: string
  operatorType: string
  type: 'TERMS_FILTERS_SET_OPERATOR'
}
export type TermsFiltersSetValue = {
  filterKey: string
  type: 'TERMS_FILTERS_SET_VALUE'
  value?: any
}
export type TermsQuerySet = {type: 'TERMS_QUERY_SET'; query: string}
export type TermsSet = {type: 'TERMS_SET'; filters?: SearchFilter[]; terms: SearchTerms}
export type TermsTypeAdd = {type: 'TERMS_TYPE_ADD'; schemaType: SchemaType}
export type TermsTypeRemove = {type: 'TERMS_TYPE_REMOVE'; schemaType: SchemaType}
export type TermsTypesClear = {type: 'TERMS_TYPES_CLEAR'}

export type SearchAction =
  | FiltersVisibleSet
  | LastActiveIndexSet
  | OrderingReset
  | OrderingSet
  | PageIncrement
  | SearchClear
  | SearchRequestComplete
  | SearchRequestError
  | SearchRequestStart
  | TermsFiltersAdd
  | TermsFiltersClear
  | TermsFiltersSetOperator
  | TermsFiltersRemove
  | TermsFiltersSetValue
  | TermsQuerySet
  | TermsSet
  | TermsTypeAdd
  | TermsTypeRemove
  | TermsTypesClear

const debug = debugWithName('reducer')

export function searchReducer(state: SearchReducerState, action: SearchAction): SearchReducerState {
  let prefix = '🔍'
  if (action.type.startsWith('SEARCH_REQUEST')) {
    prefix = '🚨'
  }
  if (action.type.startsWith('RECENT_SEARCHES')) {
    prefix = '💾'
  }
  debug(prefix, action)

  switch (action.type) {
    case 'FILTERS_VISIBLE_SET':
      return {
        ...state,
        filtersVisible: action.visible,
      }
    case 'LAST_ACTIVE_INDEX_SET':
      return {
        ...state,
        lastActiveIndex: action.index,
      }
    case 'ORDERING_RESET':
      return {
        ...state,
        ordering: getOrderings({searchStrategy: state.strategy}).relevance,
        terms: stripRecent(state.terms),
        cursor: null,
        nextCursor: null,
        result: {
          ...state.result,
          hasLocal: false,
        },
      }
    case 'ORDERING_SET':
      return {
        ...state,
        ordering: action.ordering,
        terms: stripRecent(state.terms),
        cursor: null,
        nextCursor: null,
        result: {
          ...state.result,
          hasLocal: false,
        },
      }
    case 'PAGE_INCREMENT':
      return {
        ...state,
        cursor: state.nextCursor ?? state.cursor,
        nextCursor: null,
        terms: stripRecent(state.terms),
      }
    case 'SEARCH_CLEAR':
      return {
        ...state,
        cursor: null,
        nextCursor: null,
        result: {
          ...state.result,
          hasLocal: false,
          hits: [],
        },
      }
    case 'SEARCH_REQUEST_COMPLETE':
      return {
        ...state,
        nextCursor: action.nextCursor ?? null,
        result: {
          ...state.result,
          error: null,
          hasLocal: true,
          hits: state.result.hasLocal
            ? removeDupes([...state.result.hits, ...action.hits].map(({hit}) => hit)).map(
                (hit) => ({hit}),
              )
            : action.hits,
          loaded: true,
          loading: false,
        },
      }
    case 'SEARCH_REQUEST_ERROR':
      return {
        ...state,
        result: {
          ...state.result,
          error: action.error,
          loaded: false,
          loading: false,
        },
      }
    case 'SEARCH_REQUEST_START':
      return {
        ...state,
        result: {
          ...state.result,
          loaded: false,
          loading: true,
        },
      }
    case 'TERMS_FILTERS_ADD': {
      const newFilter: SearchFilter = {
        ...action.filter,
        value: getOperatorInitialValue(state.definitions.operators, action.filter.operatorType),
      }
      const filters = [...state.filters, newFilter]

      return {
        ...state,
        documentTypesNarrowed: narrowDocumentTypes({
          fieldDefinitions: state.definitions.fields,
          filters,
          types: state.terms.types,
        }),
        filters,
        lastAddedFilter: newFilter,
        cursor: null,
        nextCursor: null,
        terms: {
          ...state.terms,
          filter: generateFilterQuery({
            fieldDefinitions: state.definitions.fields,
            filterDefinitions: state.definitions.filters,
            filters,
            operatorDefinitions: state.definitions.operators,
          }),
        },
        result: {
          ...state.result,
          hasLocal: false,
        },
      }
    }
    case 'TERMS_FILTERS_CLEAR': {
      const filters: SearchFilter[] = []

      return {
        ...state,
        documentTypesNarrowed: narrowDocumentTypes({
          fieldDefinitions: state.definitions.fields,
          filters,
          types: state.terms.types,
        }),
        filters,
        cursor: null,
        nextCursor: null,
        terms: {
          ...state.terms,
          filter: generateFilterQuery({
            fieldDefinitions: state.definitions.fields,
            filterDefinitions: state.definitions.filters,
            filters,
            operatorDefinitions: state.definitions.operators,
          }),
        },
        result: {
          ...state.result,
          hasLocal: false,
        },
      }
    }
    case 'TERMS_FILTERS_REMOVE': {
      const index = state.filters.findIndex((filter) => getFilterKey(filter) === action.filterKey)

      const filters = [
        ...state.filters.slice(0, index), //
        ...state.filters.slice(index + 1),
      ]

      return {
        ...state,
        documentTypesNarrowed: narrowDocumentTypes({
          fieldDefinitions: state.definitions.fields,
          filters,
          types: state.terms.types,
        }),
        filters,
        cursor: null,
        nextCursor: null,
        terms: {
          ...state.terms,
          filter: generateFilterQuery({
            fieldDefinitions: state.definitions.fields,
            filterDefinitions: state.definitions.filters,
            filters,
            operatorDefinitions: state.definitions.operators,
          }),
        },
        result: {
          ...state.result,
          hasLocal: false,
        },
      }
    }
    case 'TERMS_FILTERS_SET_OPERATOR': {
      // Compare input components between current and target operators, and update
      // target filter value if it has changed.
      const matchedFilter = state.filters.find(
        (filter) => getFilterKey(filter) === action.filterKey,
      )
      const currentOperator = getOperatorDefinition(
        state.definitions.operators,
        matchedFilter?.operatorType,
      )
      const nextOperator = getOperatorDefinition(state.definitions.operators, action.operatorType)
      const nextInitialValue = nextOperator?.initialValue
      const inputComponentChanged = currentOperator?.inputComponent != nextOperator?.inputComponent

      const filters = state.filters.map((filter) => {
        if (getFilterKey(filter) === action.filterKey) {
          return {
            ...filter,
            operatorType: action.operatorType,
            ...(inputComponentChanged ? {value: nextInitialValue} : {}),
          }
        }
        return filter
      })

      return {
        ...state,
        filters,
        cursor: null,
        nextCursor: null,
        terms: {
          ...state.terms,
          filter: generateFilterQuery({
            fieldDefinitions: state.definitions.fields,
            filterDefinitions: state.definitions.filters,
            filters,
            operatorDefinitions: state.definitions.operators,
          }),
        },
        result: {
          ...state.result,
          hasLocal: false,
        },
      }
    }
    case 'TERMS_FILTERS_SET_VALUE': {
      const filters = state.filters.map((filter) => {
        if (getFilterKey(filter) === action.filterKey) {
          return {
            ...filter,
            value: action.value,
          }
        }
        return filter
      })

      return {
        ...state,
        filters,
        cursor: null,
        nextCursor: null,
        terms: {
          ...state.terms,
          filter: generateFilterQuery({
            fieldDefinitions: state.definitions.fields,
            filterDefinitions: state.definitions.filters,
            filters,
            operatorDefinitions: state.definitions.operators,
          }),
        },
        result: {
          ...state.result,
          hasLocal: false,
        },
      }
    }
    case 'TERMS_QUERY_SET':
      return {
        ...state,
        cursor: null,
        nextCursor: null,
        result: {
          ...state.result,
          loaded: false,
          hasLocal: false,
        },
        terms: stripRecent({
          ...state.terms,
          query: action.query,
        }),
      }
    case 'TERMS_SET': {
      const filters = action.filters || []
      const types = [
        ...(state.terms.types || []), //
        ...action.terms.types,
      ].sort(sortTypes)

      return {
        ...state,
        documentTypesNarrowed: narrowDocumentTypes({
          fieldDefinitions: state.definitions.fields,
          filters,
          types,
        }),
        filters,
        lastAddedFilter: null,
        cursor: null,
        nextCursor: null,
        result: {
          ...state.result,
          loaded: false,
          hasLocal: false,
        },
        terms: {
          ...action.terms,
          filter: generateFilterQuery({
            fieldDefinitions: state.definitions.fields,
            filterDefinitions: state.definitions.filters,
            filters,
            operatorDefinitions: state.definitions.operators,
          }),
        },
      }
    }
    case 'TERMS_TYPE_ADD': {
      const types = [
        ...(state.terms.types || []), //
        action.schemaType,
      ].sort(sortTypes)

      // Get narrowed document types based on selected types only (ignore filters)
      const documentTypesNarrowed = narrowDocumentTypes({
        fieldDefinitions: state.definitions.fields,
        filters: [],
        types,
      })

      // Remove field filters that don't qualify under the above narrowed document types.
      // Non field-filters are always included.
      const filters = state.filters.filter((f) => {
        const fieldDefinition = getFieldFromFilter(state.definitions.fields, f)
        if (fieldDefinition) {
          // An empty documentTypes array denotes support across all fields.
          if (fieldDefinition.documentTypes.length === 0) {
            return true
          }
          return documentTypesNarrowed.every(
            (type) => fieldDefinition.documentTypes.findIndex((t) => t === type) > -1,
          )
        }
        return true
      })

      return {
        ...state,
        documentTypesNarrowed,
        filters,
        cursor: null,
        nextCursor: null,
        result: {
          ...state.result,
          loaded: false,
          hasLocal: false,
        },
        terms: stripRecent({
          ...state.terms,
          filter: generateFilterQuery({
            fieldDefinitions: state.definitions.fields,
            filterDefinitions: state.definitions.filters,
            operatorDefinitions: state.definitions.operators,
            filters,
          }),
          types,
        }),
      }
    }
    case 'TERMS_TYPE_REMOVE': {
      const types = (state.terms.types || []).filter((s) => s !== action.schemaType)

      return {
        ...state,
        documentTypesNarrowed: narrowDocumentTypes({
          fieldDefinitions: state.definitions.fields,
          filters: state.filters,
          types,
        }),
        cursor: null,
        nextCursor: null,
        result: {
          ...state.result,
          loaded: false,
          hasLocal: false,
        },
        terms: stripRecent({
          ...state.terms,
          types,
        }),
      }
    }
    case 'TERMS_TYPES_CLEAR': {
      const types: SchemaType[] = []

      return {
        ...state,
        documentTypesNarrowed: narrowDocumentTypes({
          fieldDefinitions: state.definitions.fields,
          filters: state.filters,
          types,
        }),
        cursor: null,
        nextCursor: null,
        result: {
          ...state.result,
          loaded: false,
          hasLocal: false,
        },
        terms: stripRecent({
          ...state.terms,
          types: [],
        }),
      }
    }
    default:
      return state
  }
}

/**
 * This function is used to strip __recent from terms, generally whenever there's a change in
 * search terms or options that would otherwise trigger an additional search request.
 * (e.g. updating the search query, changing a sort filter, adding / removing document types)
 *
 * This is done so we can better disambiguate between requests sent as a result of clicking a 'recent search'
 * for purposes of measurement.
 *
 */
// @todo: remove this (and associated tests) once client-side instrumentation is available
function stripRecent(terms: RecentSearch | SearchTerms) {
  if (isRecentSearchTerms(terms)) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const {__recent, ...rest} = terms
    return rest
  }
  return terms
}
