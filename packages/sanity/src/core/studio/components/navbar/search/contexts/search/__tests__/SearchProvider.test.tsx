/**
 * Focused tests for `Global Search Latency Measured` telemetry wired through
 * `SearchProvider`. The strategy is to mock `useSearch` so we can capture the
 * `onStart`/`onComplete`/`onError` callbacks that `SearchProvider` passes in,
 * then invoke them in controlled sequences. Everything else that
 * `SearchProvider` depends on is mocked with minimal stubs.
 */
import {render} from '@testing-library/react'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

vi.mock('@sanity/telemetry/react', () => ({
  useTelemetry: vi.fn(),
}))

// Capture the last props passed to `useSearch`, so tests can invoke the
// `onStart`/`onComplete`/`onError` callbacks synchronously.
const useSearchMock = vi.fn()
vi.mock('../../hooks/useSearch', () => ({
  useSearch: (props: unknown) => useSearchMock(props),
}))

vi.mock('../../../../../../hooks', () => ({
  useSchema: () => ({get: () => undefined}),
}))

vi.mock('../../../../../../releases/store/useActiveReleases', () => ({
  useActiveReleases: () => ({data: []}),
}))

vi.mock('../../../../../../store', () => ({
  useCurrentUser: () => ({id: 'user-1'}),
}))

vi.mock('../../../../../source', () => ({
  useSource: () => ({
    search: {
      operators: [],
      filters: [],
      strategy: 'groq2024',
    },
  }),
}))

vi.mock('sanity/_singletons', () => ({
  SearchContext: {
    Provider: ({children}: {children: React.ReactNode}) => <>{children}</>,
  },
}))

vi.mock('../../definitions/fields', () => ({
  createFieldDefinitions: () => [],
  createFieldDefinitionDictionary: () => ({}),
}))

vi.mock('../../definitions/filters', () => ({
  createFilterDefinitionDictionary: () => ({}),
}))

vi.mock('../../definitions/operators', () => ({
  createOperatorDefinitionDictionary: () => ({}),
}))

// Default to "searchable" — tests can override if needed.
const hasSearchableTermsMock = vi.fn().mockReturnValue(true)
vi.mock('../../utils/hasSearchableTerms', () => ({
  hasSearchableTerms: (args: unknown) => hasSearchableTermsMock(args),
}))

vi.mock('../../utils/filterUtils', () => ({
  validateFilter: () => true,
}))

vi.mock('../../utils/isRecentSearchTerms', () => ({
  isRecentSearchTerms: () => false,
}))

// Initial reducer state — just enough for SearchProvider to initialise.
vi.mock('./reducer', () => ({
  initialSearchState: () => ({
    currentUser: {id: 'user-1'},
    cursor: null,
    definitions: {fields: {}, filters: {}, operators: {}},
    documentTypesNarrowed: [],
    filters: [],
    fullscreen: false,
    hits: [],
    lastAddedFilter: null,
    lastActiveIndex: 0,
    ordering: {sort: null, customMeasurementLabel: null, ignoreScore: false},
    pagination: {cursor: null, nextCursor: null},
    perspective: null,
    pageIndex: 0,
    result: {hits: [], loading: false, loaded: false, error: null},
    recentSearches: [],
    strategy: 'groq2024',
    terms: {query: 'hello', types: []},
  }),
  searchReducer: (state: unknown) => state,
}))

interface SearchCallbacks {
  onStart?: () => void
  onComplete?: (r: {hits: unknown[]; nextCursor: string | undefined}) => void
  onError?: (e: Error) => void
}

describe('SearchProvider — Global Search Latency Measured', () => {
  let telemetryLog: ReturnType<typeof vi.fn>
  let capturedCallbacks: SearchCallbacks | null
  let SearchProvider: typeof import('../SearchProvider').SearchProvider
  let GlobalSearchLatencyMeasured: typeof import('../../__telemetry__/search.telemetry').GlobalSearchLatencyMeasured

  beforeEach(async () => {
    vi.resetModules()
    telemetryLog = vi.fn()
    capturedCallbacks = null
    hasSearchableTermsMock.mockReturnValue(true)

    const {useTelemetry} = await import('@sanity/telemetry/react')
    ;(useTelemetry as ReturnType<typeof vi.fn>).mockReturnValue({log: telemetryLog})

    useSearchMock.mockImplementation((props: SearchCallbacks) => {
      capturedCallbacks = props
      return {handleSearch: vi.fn(), searchState: {terms: {query: '', types: []}}}
    })
    ;({SearchProvider} = await import('../SearchProvider'))
    ;({GlobalSearchLatencyMeasured} = await import('../../__telemetry__/search.telemetry'))
  })

  afterEach(() => {
    vi.clearAllMocks()
    hasSearchableTermsMock.mockReset()
    hasSearchableTermsMock.mockReturnValue(true)
  })

  it('logs Global Search Latency Measured after a successful search', () => {
    render(
      <SearchProvider>
        <div />
      </SearchProvider>,
    )

    expect(capturedCallbacks).not.toBeNull()
    capturedCallbacks!.onStart!()
    capturedCallbacks!.onComplete!({
      hits: [{hit: {_id: 'a', _type: 'post'}}, {hit: {_id: 'b', _type: 'post'}}],
      nextCursor: undefined,
    })

    expect(telemetryLog).toHaveBeenCalledTimes(1)
    expect(telemetryLog).toHaveBeenCalledWith(
      GlobalSearchLatencyMeasured,
      expect.objectContaining({
        errored: false,
        resultCount: 2,
        queryLength: 'hello'.length,
        typeFilterCount: 0,
        strategy: 'groq2024',
        durationMs: expect.any(Number),
      }),
    )
    expect(telemetryLog.mock.calls[0][1].durationMs).toBeGreaterThanOrEqual(0)
  })

  it('logs Global Search Latency Measured with errored=true after a failure', () => {
    render(
      <SearchProvider>
        <div />
      </SearchProvider>,
    )

    capturedCallbacks!.onStart!()
    capturedCallbacks!.onError!(new Error('boom'))

    expect(telemetryLog).toHaveBeenCalledTimes(1)
    expect(telemetryLog).toHaveBeenCalledWith(
      GlobalSearchLatencyMeasured,
      expect.objectContaining({errored: true, resultCount: 0}),
    )
  })

  it('does not log when terms are not searchable (empty-term short-circuit)', () => {
    hasSearchableTermsMock.mockReturnValue(false)

    render(
      <SearchProvider>
        <div />
      </SearchProvider>,
    )

    capturedCallbacks!.onStart!()
    capturedCallbacks!.onComplete!({hits: [], nextCursor: undefined})

    expect(telemetryLog).not.toHaveBeenCalled()
  })

  it('does not log onComplete if there was no matching onStart (e.g. stale complete after reset)', () => {
    render(
      <SearchProvider>
        <div />
      </SearchProvider>,
    )

    // onComplete without a preceding onStart → timing ref is null → no log.
    capturedCallbacks!.onComplete!({hits: [], nextCursor: undefined})

    expect(telemetryLog).not.toHaveBeenCalled()
  })

  it('produces one event per onStart/onComplete pair (no double-fires)', () => {
    render(
      <SearchProvider>
        <div />
      </SearchProvider>,
    )

    capturedCallbacks!.onStart!()
    capturedCallbacks!.onComplete!({hits: [], nextCursor: undefined})
    // A second onComplete without onStart must not log again.
    capturedCallbacks!.onComplete!({hits: [], nextCursor: undefined})

    expect(telemetryLog).toHaveBeenCalledTimes(1)
  })
})
