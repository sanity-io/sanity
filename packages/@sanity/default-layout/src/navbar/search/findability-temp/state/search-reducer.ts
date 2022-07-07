import {SearchTerms} from '@sanity/base'
import {ObjectSchemaType} from '@sanity/types'
import {Dispatch, ReducerState, useReducer} from 'react'
import {SearchHit} from '../../types'
import {sortTypes} from '../utils/helpers'

export interface SearchReducerState {
  terms: SearchTerms
  result: SearchResult
}

export interface SearchResult {
  hits: SearchHit[]
  loading: boolean
  error: Error | null
}

export const INITIAL_SEARCH_STATE: SearchReducerState = {
  terms: {
    query: '',
    types: [],
  },
  result: {
    hits: [],
    loading: false,
    error: null,
  },
}

export type UpdateSearchState = {type: 'UPDATE_SEARCH_RESULT'; result: Partial<SearchResult>}
export type AppendHits = {type: 'APPEND_HITS'; hits: SearchHit[]}
export type SetTerms = {type: 'SET_TERMS'; terms: SearchTerms}
export type FreeTextUpdated = {type: 'TEXT_QUERY'; query: string}
export type ClearTypes = {type: 'CLEAR_TYPES'}
export type AddType = {type: 'ADD_TYPE'; schemaType: ObjectSchemaType}
export type RemoveType = {type: 'REMOVE_TYPE'; schemaType: ObjectSchemaType}
export type SearchAction =
  | UpdateSearchState
  | AppendHits
  | SetTerms
  | FreeTextUpdated
  | ClearTypes
  | AddType
  | RemoveType

function searchReducer(state: SearchReducerState, action: SearchAction): SearchReducerState {
  switch (action.type) {
    case 'UPDATE_SEARCH_RESULT':
      return {
        ...state,
        result: {
          ...state.result,
          ...action.result,
        },
      }
    case 'APPEND_HITS':
      return {
        ...state,
        result: {
          ...state.result,
          hits: [...state.result.hits, ...action.hits],
        },
      }
    case 'SET_TERMS':
      return {
        ...state,
        terms: action.terms,
      }
    case 'TEXT_QUERY':
      return {
        ...state,
        terms: {
          ...state.terms,
          query: action.query,
        },
      }
    case 'ADD_TYPE':
      return {
        ...state,
        terms: {
          ...state.terms,
          types: [...state.terms.types, action.schemaType].sort(sortTypes),
        },
      }
    case 'REMOVE_TYPE':
      return {
        ...state,
        terms: {
          ...state.terms,
          types: state.terms.types.filter((s) => s !== action.schemaType),
        },
      }
    case 'CLEAR_TYPES':
      return {
        ...state,
        terms: {
          ...state.terms,
          types: [],
        },
      }
    default:
      return state
  }
}

export function useSearchReducer(
  initialValue: SearchReducerState = INITIAL_SEARCH_STATE
): [ReducerState<typeof searchReducer>, Dispatch<SearchAction>] {
  return useReducer(searchReducer, initialValue)
}
