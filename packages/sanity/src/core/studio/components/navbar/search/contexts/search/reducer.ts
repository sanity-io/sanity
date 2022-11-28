import type {CurrentUser} from '@sanity/types'
import intersection from 'lodash/intersection'
import isEmpty from 'lodash/isEmpty'
import type {SearchableType, SearchTerms, WeightedHit} from '../../../../../../search'
import {isNonNullable} from '../../../../../../util'
import type {RecentSearch} from '../../datastores/recentSearches'
import {
  getFilterDefinition,
  getFilterDefinitionInitialOperatorType,
  SearchFilterDefinition,
} from '../../definitions/filters'
import {getOperator, getOperatorInitialValue, SearchOperator} from '../../definitions/operators'
import {ORDERINGS} from '../../definitions/orderings'
import type {SearchFieldDefinition, SearchFilter, SearchOrdering} from '../../types'
import {debugWithName, isDebugMode} from '../../utils/debug'
import {getFieldFromFilter, getFilterKey, isFilterComplete} from '../../utils/filterUtils'
import {isRecentSearchTerms} from '../../utils/isRecentSearchTerms'
import {sortTypes} from '../../utils/selectors'

export interface SearchReducerState {
  currentUser: CurrentUser | null
  debug: boolean
  definitions: SearchDefinitions
  documentTypesNarrowed: string[]
  filters: SearchFilter[]
  filtersVisible: boolean
  fullscreen?: boolean
  lastAddedFilter?: SearchFilter | null
  ordering: SearchOrdering
  pageIndex: number
  recentSearches: RecentSearch[]
  result: SearchResult
  terms: RecentSearch | SearchTerms
}

export interface SearchDefinitions {
  fields: SearchFieldDefinition[]
  filters: SearchFilterDefinition[]
  operators: SearchOperator[]
}

export interface SearchResult {
  error: Error | null
  hasMore?: boolean | null
  hits: WeightedHit[]
  loaded: boolean
  loading: boolean
}

export interface InitialSearchState {
  currentUser: CurrentUser | null
  fullscreen?: boolean
  recentSearches?: RecentSearch[]
  definitions: SearchDefinitions
}

export function initialSearchState({
  currentUser,
  fullscreen,
  recentSearches = [],
  definitions,
}: InitialSearchState): SearchReducerState {
  return {
    currentUser,
    debug: isDebugMode(),
    documentTypesNarrowed: [],
    filters: [],
    filtersVisible: true,
    fullscreen,
    ordering: ORDERINGS.relevance,
    pageIndex: 0,
    recentSearches,
    result: {
      error: null,
      hasMore: null,
      hits: [],
      loaded: false,
      loading: false,
    },
    terms: {
      query: '',
      types: [],
    },
    definitions,
  }
}

export type FiltersVisibleSet = {type: 'FILTERS_VISIBLE_SET'; visible: boolean}
export type PageIncrement = {type: 'PAGE_INCREMENT'}
export type RecentSearchesSet = {
  recentSearches: RecentSearch[]
  type: 'RECENT_SEARCHES_SET'
}
export type OrderingReset = {type: 'ORDERING_RESET'}
export type OrderingSet = {ordering: SearchOrdering; type: 'ORDERING_SET'}
export type SearchClear = {type: 'SEARCH_CLEAR'}
export type SearchRequestComplete = {
  type: 'SEARCH_REQUEST_COMPLETE'
  hits: WeightedHit[]
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
export type TermsTypeAdd = {type: 'TERMS_TYPE_ADD'; schemaType: SearchableType}
export type TermsTypeRemove = {type: 'TERMS_TYPE_REMOVE'; schemaType: SearchableType}
export type TermsTypesClear = {type: 'TERMS_TYPES_CLEAR'}

export type SearchAction =
  | FiltersVisibleSet
  | OrderingReset
  | OrderingSet
  | PageIncrement
  | RecentSearchesSet
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

// TODO: split into multiple reducers and combine. Also consider immer
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
    case 'ORDERING_RESET':
      return {
        ...state,
        ordering: ORDERINGS.relevance,
        terms: stripRecent(state.terms),
      }
    case 'ORDERING_SET':
      return {
        ...state,
        ordering: action.ordering,
        terms: stripRecent(state.terms),
      }
    case 'PAGE_INCREMENT':
      return {
        ...state,
        pageIndex: state.pageIndex + 1,
        terms: stripRecent(state.terms),
      }
    case 'RECENT_SEARCHES_SET':
      return {
        ...state,
        recentSearches: action.recentSearches,
      }
    case 'SEARCH_CLEAR':
      return {
        ...state,
        pageIndex: 0,
        result: {
          ...state.result,
          hasMore: null,
          hits: [],
        },
      }
    case 'SEARCH_REQUEST_COMPLETE':
      return {
        ...state,
        result: {
          ...state.result,
          error: null,
          hasMore: action.hits.length > 0,
          hits: state.pageIndex > 0 ? [...state.result.hits, ...action.hits] : action.hits,
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
      const operatorType = getFilterDefinitionInitialOperatorType(
        state.definitions.filters,
        action.filter.filterType
      )

      const newFilter: SearchFilter = {
        ...action.filter,
        // Set initial value + operator
        operatorType,
        value: operatorType && getOperatorInitialValue(state.definitions.operators, operatorType),
      }

      const filters = [
        ...state.filters, //
        newFilter,
      ]

      return {
        ...state,
        documentTypesNarrowed: narrowDocumentTypes(
          state.definitions.fields,
          state.terms.types,
          filters
        ),
        filters,
        lastAddedFilter: newFilter,
        terms: {
          ...state.terms,
          filter: generateFilterQuery({
            fieldDefinitions: state.definitions.fields,
            filterDefinitions: state.definitions.filters,
            filters,
            operators: state.definitions.operators,
          }),
        },
      }
    }
    case 'TERMS_FILTERS_CLEAR': {
      const filters: SearchFilter[] = []
      return {
        ...state,
        documentTypesNarrowed: narrowDocumentTypes(
          state.definitions.fields,
          state.terms.types,
          filters
        ),
        filters,
        terms: {
          ...state.terms,
          filter: generateFilterQuery({
            fieldDefinitions: state.definitions.fields,
            filterDefinitions: state.definitions.filters,
            filters,
            operators: state.definitions.operators,
          }),
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
        documentTypesNarrowed: narrowDocumentTypes(
          state.definitions.fields,
          state.terms.types,
          filters
        ),
        filters,
        terms: {
          ...state.terms,
          filter: generateFilterQuery({
            fieldDefinitions: state.definitions.fields,
            filterDefinitions: state.definitions.filters,
            filters,
            operators: state.definitions.operators,
          }),
        },
      }
    }
    case 'TERMS_FILTERS_SET_OPERATOR': {
      // Compare input components between current and target operators, and update
      // target filter value if it has changed.
      const matchedFilter = state.filters.find(
        (filter) => getFilterKey(filter) === action.filterKey
      )
      const currentOperator = getOperator(state.definitions.operators, matchedFilter?.operatorType)
      const nextOperator = getOperator(state.definitions.operators, action.operatorType)
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
        terms: {
          ...state.terms,
          filter: generateFilterQuery({
            fieldDefinitions: state.definitions.fields,
            filterDefinitions: state.definitions.filters,
            filters,
            operators: state.definitions.operators,
          }),
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
        terms: {
          ...state.terms,
          filter: generateFilterQuery({
            fieldDefinitions: state.definitions.fields,
            filterDefinitions: state.definitions.filters,
            filters,
            operators: state.definitions.operators,
          }),
        },
      }
    }
    case 'TERMS_QUERY_SET':
      return {
        ...state,
        pageIndex: 0,
        result: {
          ...state.result,
          loaded: false,
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
        documentTypesNarrowed: narrowDocumentTypes(state.definitions.fields, types, filters),
        filters,
        lastAddedFilter: null,
        pageIndex: 0,
        result: {
          ...state.result,
          loaded: false,
        },
        terms: {
          ...action.terms,
          filter: generateFilterQuery({
            fieldDefinitions: state.definitions.fields,
            filterDefinitions: state.definitions.filters,
            filters,
            operators: state.definitions.operators,
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
      const documentTypesNarrowed = narrowDocumentTypes(state.definitions.fields, types, [])

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
            (type) => fieldDefinition.documentTypes.findIndex((t) => t === type) > -1
          )
        }
        return true
      })

      return {
        ...state,
        documentTypesNarrowed,
        filters,
        pageIndex: 0,
        result: {
          ...state.result,
          loaded: false,
        },
        terms: stripRecent({
          ...state.terms,
          filter: generateFilterQuery({
            fieldDefinitions: state.definitions.fields,
            filterDefinitions: state.definitions.filters,
            operators: state.definitions.operators,
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
        documentTypesNarrowed: narrowDocumentTypes(state.definitions.fields, types, state.filters),
        pageIndex: 0,
        result: {
          ...state.result,
          loaded: false,
        },
        terms: stripRecent({
          ...state.terms,
          types,
        }),
      }
    }
    case 'TERMS_TYPES_CLEAR': {
      const types: SearchableType[] = []
      return {
        ...state,
        documentTypesNarrowed: narrowDocumentTypes(state.definitions.fields, types, state.filters),
        pageIndex: 0,
        result: {
          ...state.result,
          loaded: false,
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
// TODO: remove this (and associated tests) once client-side instrumentation is available
function stripRecent(terms: RecentSearch | SearchTerms) {
  if (isRecentSearchTerms(terms)) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const {__recent, ...rest} = terms
    return rest
  }
  return terms
}

function narrowDocumentTypes(
  fieldDefinitions: SearchFieldDefinition[],
  types: SearchableType[],
  filters: SearchFilter[]
): string[] {
  // Get all 'manually' selected document types
  const selectedDocumentTypes = types.map((type) => type.name)

  const filteredDocumentTypes = fieldDefinitions
    .filter((field) => filters.map((filter) => filter?.fieldId).includes(field.id))
    .filter((field) => field.documentTypes.length > 0)
    .map((field) => field.documentTypes)

  // Get intersecting document types across all active filters (that have at least one document type).
  // Filters that have no document types (i.e. `_updatedAt` which is available to all) are ignored.
  const intersectingDocumentTypes = intersection(...filteredDocumentTypes)

  const documentTypes: string[][] = []
  if (selectedDocumentTypes.length > 0) {
    documentTypes.push(selectedDocumentTypes)
  }
  if (intersectingDocumentTypes.length > 0) {
    documentTypes.push(intersectingDocumentTypes)
  }

  return intersection(...documentTypes).sort()
}

function generateFilterQuery({
  fieldDefinitions,
  filterDefinitions,
  filters,
  operators,
}: {
  fieldDefinitions: SearchFieldDefinition[]
  filterDefinitions: SearchFilterDefinition[]
  filters: SearchFilter[]
  operators: SearchOperator[]
}) {
  return filters
    .filter((filter) => isFilterComplete(filter, filterDefinitions, fieldDefinitions, operators))
    .map((filter) => {
      const fieldDefinition = fieldDefinitions.find((field) => field.id === filter?.fieldId)
      const filterDefinition = getFilterDefinition(filterDefinitions, filter.filterType)
      return getOperator(operators, filter.operatorType)?.fn({
        fieldPath:
          filterDefinition?.type === 'pinned'
            ? filterDefinition?.fieldPath
            : fieldDefinition?.fieldPath,
        value: filter?.value,
      })
    })
    .filter((filter) => !isEmpty(filter))
    .filter(isNonNullable)
    .join(' && ')
}
