import {type CurrentUser, type SchemaType} from '@sanity/types'
import {act, renderHook} from '@testing-library/react'
import {useReducer} from 'react'
import {describe, expect, it} from 'vitest'

import {type RecentSearch} from '../../datastores/recentSearches'
import {type SearchOrdering} from '../../types'
import {
  type InitialSearchState,
  initialSearchState,
  type SearchAction,
  searchReducer,
  type SearchReducerState,
} from './reducer'

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

const initialStateContext: InitialSearchState = {
  currentUser: mockUser,
  definitions: {fields: {}, filters: {}, operators: {}},
  pagination: {cursor: null, nextCursor: null},
}

const initialState: SearchReducerState = {
  ...initialSearchState(initialStateContext),
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

  it('should order by `_updatedAt` when using GROQ Query API strategy and ordering by relevance', () => {
    const {result} = renderHook(() =>
      useReducer(
        searchReducer,
        initialSearchState({
          ...initialStateContext,
          strategy: 'groqLegacy',
        }),
      ),
    )

    const [state] = result.current

    expect(state.ordering).toMatchInlineSnapshot(`
      {
        "customMeasurementLabel": "relevance",
        "sort": {
          "direction": "desc",
          "field": "_updatedAt",
        },
        "titleKey": "search.ordering.best-match-label",
      }
    `)
  })

  it.each<SearchAction>([
    {
      type: 'SEARCH_CLEAR',
    },
    {
      type: 'TERMS_QUERY_SET',
      query: 'test query b',
    },
    {
      type: 'TERMS_SET',
      terms: {
        query: 'test',
        types: [],
      },
    },
    {
      type: 'ORDERING_SET',
      ordering: {
        titleKey: 'search.ordering.test-label',
        sort: {
          field: '_createdAt',
          direction: 'desc',
        },
      },
    },
    {
      type: 'ORDERING_RESET',
    },
    {
      type: 'TERMS_FILTERS_ADD',
      filter: {
        filterName: 'test',
        operatorType: 'test',
      },
    },
    {
      type: 'TERMS_FILTERS_REMOVE',
      filterKey: 'test',
    },
    {
      type: 'TERMS_FILTERS_SET_OPERATOR',
      filterKey: 'test',
      operatorType: 'test',
    },
    {
      type: 'TERMS_FILTERS_SET_VALUE',
      filterKey: 'test',
    },
    {
      type: 'TERMS_FILTERS_CLEAR',
    },
    {
      type: 'TERMS_TYPE_ADD',
      schemaType: mockSearchableType,
    },
    {
      type: 'TERMS_TYPE_REMOVE',
      schemaType: mockSearchableType,
    },
    {
      type: 'TERMS_TYPES_CLEAR',
    },
  ])('should reset cursor state when any parameter changes ($type)', async (action) => {
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
        hits: [],
      }),
    )

    act(() =>
      dispatch({
        type: 'PAGE_INCREMENT',
      }),
    )

    act(() =>
      dispatch({
        type: 'SEARCH_REQUEST_COMPLETE',
        nextCursor: 'cursorB',
        hits: [],
      }),
    )

    const [stateA] = result.current

    expect(stateA.cursor).toBe('cursorA')
    expect(stateA.nextCursor).toBe('cursorB')
    act(() => dispatch(action))

    const [stateB] = result.current

    expect(stateB.cursor).toBeNull()
    expect(stateB.nextCursor).toBeNull()
  })
})

it.each<SearchAction>([
  {
    type: 'SEARCH_CLEAR',
  },
  {
    type: 'TERMS_QUERY_SET',
    query: 'test query b',
  },
  {
    type: 'TERMS_SET',
    terms: {
      query: 'test',
      types: [],
    },
  },
  {
    type: 'ORDERING_SET',
    ordering: {
      titleKey: 'search.ordering.test-label',
      sort: {
        field: '_createdAt',
        direction: 'desc',
      },
    },
  },
  {
    type: 'ORDERING_RESET',
  },
  {
    type: 'TERMS_FILTERS_ADD',
    filter: {
      filterName: 'test',
      operatorType: 'test',
    },
  },
  {
    type: 'TERMS_FILTERS_REMOVE',
    filterKey: 'test',
  },
  {
    type: 'TERMS_FILTERS_SET_OPERATOR',
    filterKey: 'test',
    operatorType: 'test',
  },
  {
    type: 'TERMS_FILTERS_SET_VALUE',
    filterKey: 'test',
  },
  {
    type: 'TERMS_FILTERS_CLEAR',
  },
])('should reset results when SEARCH_REQUEST_COMPLETE occurs after $type', async (action) => {
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

  expect(stateA.result.hits).toEqual([
    {
      hit: {
        _id: 'personA',
        _type: 'person',
      },
    },
    {
      hit: {
        _id: 'personB',
        _type: 'person',
      },
    },
  ])
  act(() => dispatch(action))

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

  expect(stateB.result.hits).toEqual([
    {
      hit: {
        _id: 'personB',
        _type: 'person',
      },
    },
    {
      hit: {
        _id: 'personC',
        _type: 'person',
      },
    },
  ])
})
