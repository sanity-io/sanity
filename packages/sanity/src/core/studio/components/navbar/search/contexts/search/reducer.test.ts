import type {CurrentUser} from '@sanity/types'
import {act, renderHook} from '@testing-library/react'
import {useReducer} from 'react'
import type {SearchableType} from '../../../../../../search'
import type {RecentSearch} from '../../datastores/recentSearches'
import type {SearchOrdering} from '../../types'
import {initialSearchState, searchReducer, SearchReducerState} from './reducer'

const mockUser: CurrentUser = {
  id: 'mock-user',
  name: 'mock user',
  email: 'mockUser@example.com',
  role: '',
  roles: [],
}

const mockOrdering: SearchOrdering = {
  sort: {direction: 'desc', field: '_createdAt'},
  title: 'Created: Newest first',
}

const mockSearchableType: SearchableType = {
  // eslint-disable-next-line camelcase
  __experimental_search: [],
  name: 'book',
  title: 'Book',
}

const recentSearchTerms = {
  __recent: {
    index: 0,
    timestamp: new Date().getTime(),
  },
  filters: [],
  query: 'foo',
  types: [],
} as RecentSearch
const initialState: SearchReducerState = {
  ...initialSearchState({
    currentUser: mockUser,
    definitions: {fields: [], filters: [], operators: []},
  }),
  terms: recentSearchTerms,
}

describe('searchReducer', () => {
  it('should clear __recent when page index is incremented', () => {
    const {result} = renderHook(() => useReducer(searchReducer, initialState))
    const [, dispatch] = result.current

    act(() => dispatch({type: 'PAGE_INCREMENT'}))

    const [state] = result.current
    expect((state.terms as RecentSearch).__recent).toBeUndefined()
  })

  it('should clear __recent after resetting sort order', () => {
    const {result} = renderHook(() => useReducer(searchReducer, initialState))
    const [, dispatch] = result.current

    act(() => dispatch({type: 'ORDERING_RESET'}))

    const [state] = result.current
    expect((state.terms as RecentSearch).__recent).toBeUndefined()
  })

  it('should clear __recent after updating sort order', () => {
    const {result} = renderHook(() => useReducer(searchReducer, initialState))
    const [, dispatch] = result.current

    act(() => dispatch({ordering: mockOrdering, type: 'ORDERING_SET'}))

    const [state] = result.current
    expect((state.terms as RecentSearch).__recent).toBeUndefined()
  })

  it('should clear __recent after updating query', () => {
    const {result} = renderHook(() => useReducer(searchReducer, initialState))
    const [, dispatch] = result.current

    act(() => dispatch({query: 'bar', type: 'TERMS_QUERY_SET'}))

    const [state] = result.current
    expect((state.terms as RecentSearch).__recent).toBeUndefined()
  })

  it('should clear __recent after adding a document type', () => {
    const {result} = renderHook(() => useReducer(searchReducer, initialState))
    const [, dispatch] = result.current

    act(() => dispatch({schemaType: mockSearchableType, type: 'TERMS_TYPE_ADD'}))

    const [state] = result.current
    expect((state.terms as RecentSearch).__recent).toBeUndefined()
  })

  it('should clear __recent after remove a document type', () => {
    const {result} = renderHook(() => useReducer(searchReducer, initialState))
    const [, dispatch] = result.current

    act(() => dispatch({schemaType: mockSearchableType, type: 'TERMS_TYPE_REMOVE'}))

    const [state] = result.current
    expect((state.terms as RecentSearch).__recent).toBeUndefined()
  })

  it('should clear __recent after clearing all document types', () => {
    const {result} = renderHook(() => useReducer(searchReducer, initialState))
    const [, dispatch] = result.current

    act(() => dispatch({type: 'TERMS_TYPES_CLEAR'}))

    const [state] = result.current
    expect((state.terms as RecentSearch).__recent).toBeUndefined()
  })
})
