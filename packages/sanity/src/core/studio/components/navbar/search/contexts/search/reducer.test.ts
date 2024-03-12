import {describe, expect, it} from '@jest/globals'
import {type CurrentUser, type SchemaType} from '@sanity/types'
import {act, renderHook} from '@testing-library/react'
import {useReducer} from 'react'

import {type RecentSearch} from '../../datastores/recentSearches'
import {type SearchOrdering} from '../../types'
import {initialSearchState, searchReducer, type SearchReducerState} from './reducer'

const mockUser: CurrentUser = {
  id: 'mock-user',
  name: 'mock user',
  email: 'mockUser@example.com',
  role: '',
  roles: [],
}

const mockOrdering: SearchOrdering = {
  sort: {direction: 'desc', field: '_createdAt'},
  titleKey: 'search.ordering.created-descending-label',
}

const mockSearchableType = {
  name: 'book',
  title: 'Book',
} as unknown as SchemaType

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
    definitions: {fields: {}, filters: {}, operators: {}},
    pagination: {cursor: null, nextCursor: null},
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

  it('should merge results after fetching an additional page', () => {
    const {result} = renderHook(() => useReducer(searchReducer, initialState))
    const [, dispatch] = result.current

    act(() =>
      dispatch({
        type: 'SEARCH_REQUEST_COMPLETE',
        nextCursor: 'cursorA',
        hits: [
          {
            hit: {
              _type: 'person',
              _id: 'personA',
            },
          },
          {
            hit: {
              _type: 'person',
              _id: 'personB',
            },
          },
        ],
      }),
    )

    act(() =>
      dispatch({
        type: 'SEARCH_REQUEST_COMPLETE',
        nextCursor: undefined,
        hits: [
          {
            hit: {
              _type: 'person',
              _id: 'personB',
            },
          },
          {
            hit: {
              _type: 'person',
              _id: 'personC',
            },
          },
        ],
      }),
    )

    const [state] = result.current

    expect(state.result.hits).toMatchInlineSnapshot(`
Array [
  Object {
    "hit": Object {
      "_id": "personA",
      "_type": "person",
    },
  },
  Object {
    "hit": Object {
      "_id": "personB",
      "_type": "person",
    },
  },
  Object {
    "hit": Object {
      "_id": "personC",
      "_type": "person",
    },
  },
]
`)
  })
})

it('should reset results after search term changes', () => {
  const {result} = renderHook(() => useReducer(searchReducer, initialState))
  const [, dispatch] = result.current

  act(() =>
    dispatch({
      type: 'TERMS_QUERY_SET',
      query: 'test query a',
    }),
  )

  act(() =>
    dispatch({
      type: 'SEARCH_REQUEST_COMPLETE',
      nextCursor: 'cursorA',
      hits: [
        {
          hit: {
            _type: 'person',
            _id: 'personA',
          },
        },
        {
          hit: {
            _type: 'person',
            _id: 'personB',
          },
        },
      ],
    }),
  )

  const [stateA] = result.current

  expect(stateA.result.hits).toMatchInlineSnapshot(`
Array [
  Object {
    "hit": Object {
      "_id": "personA",
      "_type": "person",
    },
  },
  Object {
    "hit": Object {
      "_id": "personB",
      "_type": "person",
    },
  },
]
`)

  act(() =>
    dispatch({
      type: 'TERMS_QUERY_SET',
      query: 'test query b',
    }),
  )

  act(() =>
    dispatch({
      type: 'SEARCH_REQUEST_COMPLETE',
      nextCursor: undefined,
      hits: [
        {
          hit: {
            _type: 'person',
            _id: 'personB',
          },
        },
        {
          hit: {
            _type: 'person',
            _id: 'personC',
          },
        },
      ],
    }),
  )

  const [stateB] = result.current

  expect(stateB.result.hits).toMatchInlineSnapshot(`
Array [
  Object {
    "hit": Object {
      "_id": "personB",
      "_type": "person",
    },
  },
  Object {
    "hit": Object {
      "_id": "personC",
      "_type": "person",
    },
  },
]
`)
})
