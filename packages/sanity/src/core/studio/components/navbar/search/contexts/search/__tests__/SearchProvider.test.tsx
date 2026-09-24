import {type SanityClient} from '@sanity/client'
import {act, render} from '@testing-library/react'
import {Subject} from 'rxjs'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

import {createMockSanityClient} from '../../../../../../../../../test/mocks/mockSanityClient'
import {createTestProvider} from '../../../../../../../../../test/testUtils/TestProvider'
import {GlobalSearchLatencyMeasured} from '../../../__telemetry__/search.telemetry'
import {SearchWrapper} from '../../../components/common/SearchWrapper'
import {type GlobalSearchResults, SEARCH_DEBOUNCE_MS} from '../globalSearchMachine'
import {type SearchContextValue} from '../SearchContext'
import {SearchProvider} from '../SearchProvider'
import {useSearchSelector, useSearchState} from '../useSearchState'

const {searchMock, telemetryLog} = vi.hoisted(() => ({
  searchMock: vi.fn(),
  telemetryLog: vi.fn(),
}))

vi.mock('@sanity/telemetry/react', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  useTelemetry: () => ({log: telemetryLog}),
}))

vi.mock('../../../hooks/useGlobalSearchFunction', () => ({
  useGlobalSearchFunction: () => searchMock,
}))

const onSearchContext = vi.fn<(context: SearchContextValue) => void>()
const onQueryRender = vi.fn<(query: string) => void>()
const onFiltersRender = vi.fn()

function SearchContextConsumer() {
  onSearchContext(useSearchState())
  return null
}

function QueryConsumer() {
  onQueryRender(useSearchSelector((snapshot) => snapshot.context.terms.query))
  return null
}

function FiltersConsumer() {
  onFiltersRender(useSearchSelector((snapshot) => snapshot.context.filters))
  return null
}

function getSearchContext(): SearchContextValue {
  const context = onSearchContext.mock.lastCall?.[0]
  if (!context) throw new Error('SearchContextConsumer has not rendered')
  return context
}

function createProvider() {
  return createTestProvider({
    client: createMockSanityClient() as unknown as SanityClient,
    config: {
      name: 'default',
      projectId: 'test',
      dataset: 'test',
      schema: {
        types: [
          {
            name: 'book',
            title: 'Book',
            type: 'document',
            fields: [{name: 'title', type: 'string'}],
          },
        ],
      },
    },
  })
}

describe('SearchProvider', () => {
  let searches: Subject<GlobalSearchResults>[]

  beforeEach(() => {
    searches = []
    searchMock.mockImplementation(() => {
      const search = new Subject<GlobalSearchResults>()
      searches.push(search)
      return search
    })
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.clearAllMocks()
  })

  it('searches with the global search function and logs the latency with telemetry', async () => {
    const TestProvider = await createProvider()
    vi.useFakeTimers()
    render(
      <TestProvider>
        <SearchProvider>
          <SearchContextConsumer />
        </SearchProvider>
      </TestProvider>,
    )
    const {searchActorRef} = getSearchContext()

    act(() => searchActorRef.send({type: 'TERMS_QUERY_SET', query: 'hello'}))
    act(() => {
      vi.advanceTimersByTime(SEARCH_DEBOUNCE_MS)
    })

    expect(searchMock).toHaveBeenCalledTimes(1)
    expect(searchMock).toHaveBeenCalledWith(
      expect.objectContaining({query: 'hello'}),
      expect.objectContaining({perspective: 'raw'}),
    )

    act(() => {
      searches[0].next({type: 'groq2024', hits: [{hit: {_id: 'a', _type: 'book'}}]})
      searches[0].complete()
    })

    expect(telemetryLog).toHaveBeenCalledTimes(1)
    expect(telemetryLog).toHaveBeenCalledWith(
      GlobalSearchLatencyMeasured,
      expect.objectContaining({errored: false, queryLength: 'hello'.length, resultCount: 1}),
    )
  })

  it('re-renders consumers only when the state they select changes', async () => {
    const TestProvider = await createProvider()
    render(
      <TestProvider>
        <SearchProvider>
          <SearchContextConsumer />
          <QueryConsumer />
          <FiltersConsumer />
        </SearchProvider>
      </TestProvider>,
    )
    const {searchActorRef} = getSearchContext()
    vi.clearAllMocks()

    act(() => searchActorRef.send({type: 'TERMS_QUERY_SET', query: 'h'}))
    act(() => searchActorRef.send({type: 'TERMS_QUERY_SET', query: 'he'}))

    expect(onQueryRender.mock.calls).toEqual([['h'], ['he']])
    expect(onFiltersRender).not.toHaveBeenCalled()
    expect(onSearchContext).not.toHaveBeenCalled()
  })

  it('follows the open state of the search and gives its contents a close handler', async () => {
    const TestProvider = await createProvider()
    const onClose = vi.fn()
    const renderSearch = (open: boolean) => (
      <TestProvider>
        <SearchProvider>
          <SearchWrapper onClose={onClose} open={open}>
            <SearchContextConsumer />
          </SearchWrapper>
        </SearchProvider>
      </TestProvider>
    )

    const {rerender} = render(renderSearch(true))
    const {onClose: closeSearch, searchActorRef} = getSearchContext()
    expect(searchActorRef.getSnapshot().matches({visibility: 'open'})).toBe(true)

    // Without a results list to read the position from, closing forgets the previous one
    act(() => searchActorRef.send({type: 'LAST_ACTIVE_INDEX_SET', index: 5}))
    act(() => closeSearch?.())
    expect(onClose).toHaveBeenCalledTimes(1)
    expect(searchActorRef.getSnapshot().context.lastActiveIndex).toBe(-1)

    rerender(renderSearch(false))
    expect(searchActorRef.getSnapshot().matches({visibility: 'closed'})).toBe(true)
  })
})
