import {SearchParams} from '@sanity/base'
import {SchemaType} from '@sanity/types'
import {Dispatch, ReducerState, useReducer} from 'react'
import {SearchHit} from '../../types'
import {getRootType} from '../helpers'

interface SearchReducerState {
  query: string
  schemas: SchemaType[]
  searchState: SearchState
}

interface SearchState {
  hits: SearchHit[]
  loading: boolean
  error: Error | null
}

export const INITIAL_SEARCH_STATE: SearchReducerState = {
  query: '',
  schemas: [],
  searchState: {
    hits: [],
    loading: false,
    error: null,
  },
}

export type UpdateSearchState = {
  type: 'UPDATE_SEARCH_STATE'
  state: {hits: SearchHit[]; loading: boolean; error: Error | null}
}

export type SetTerms = {type: 'SET_TERMS'; terms: SearchParams}
export type FreeTextUpdated = {type: 'TEXT_QUERY'; query: string}
export type ClearSchemas = {type: 'CLEAR_SCHEMAS'}
export type AddSchema = {type: 'ADD_SCHEMA'; schema: SchemaType}
export type RemoveSchema = {type: 'REMOVE_SCHEMA'; schema: SchemaType}
export type SearchAction =
  | UpdateSearchState
  | SetTerms
  | FreeTextUpdated
  | ClearSchemas
  | AddSchema
  | RemoveSchema

function searchReducer(state: SearchReducerState, action: SearchAction): SearchReducerState {
  switch (action.type) {
    case 'UPDATE_SEARCH_STATE':
      return {
        ...state,
        searchState: action.state,
      }
    case 'SET_TERMS':
      return {
        ...state,
        ...action.terms,
      }
    case 'TEXT_QUERY':
      return {
        ...state,
        query: action.query,
      }
    case 'ADD_SCHEMA':
      return {
        ...state,
        schemas: [...state.schemas, action.schema].sort(sortTypes),
      }
    case 'REMOVE_SCHEMA':
      return {
        ...state,
        schemas: state.schemas.filter((s) => s !== action.schema),
      }
    case 'CLEAR_SCHEMAS':
      return {
        ...state,
        schemas: [],
      }
    default:
      return state
  }
}

export function sortTypes(a: SchemaType, b: SchemaType): number {
  return (a.title ?? a.name).localeCompare(b.title ?? b.name)
}

export function getSelectableTypes(
  schema: {
    get: (typeName: string) => SchemaType | undefined
    getTypeNames(): string[]
  },
  selectedTypes: SchemaType[],
  typeFilter: string
): SchemaType[] {
  return schema
    .getTypeNames()
    .map((n) => schema.get(n))
    .filter((s) => getRootType(s)?.name === 'document' && s.name !== 'document')
    .filter((s) => !selectedTypes.includes(s))
    .filter(
      (t) => !typeFilter || (t.title ?? t.name).toLowerCase().includes(typeFilter?.toLowerCase())
    )
    .sort(sortTypes)
}

export function useSearchReducer(
  initialValue: SearchReducerState = INITIAL_SEARCH_STATE
): [ReducerState<typeof searchReducer>, Dispatch<SearchAction>] {
  return useReducer(searchReducer, initialValue)
}
