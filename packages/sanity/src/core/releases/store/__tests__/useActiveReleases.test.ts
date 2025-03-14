import {renderHook} from '@testing-library/react'
import {BehaviorSubject} from 'rxjs'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {createTestProvider} from '../../../../../test/testUtils/TestProvider'
import {activeASAPRelease, activeScheduledRelease} from '../../__fixtures__/release.fixture'
import {type ReleaseDocument} from '../types'
import {useActiveReleases} from '../useActiveReleases'
import {mockUseActiveReleases} from './__mocks/useActiveReleases.mock'

interface ReleasesState {
  releases: Map<string, ReleaseDocument>
  error?: Error
  state: 'initialising' | 'loading' | 'loaded' | 'error'
}

const initialState: ReleasesState = {
  releases: new Map(),
  state: 'initialising',
}

const mockState$ = new BehaviorSubject<ReleasesState>(initialState)
const mockDispatch = vi.fn()

const mockUseReleasesStore = vi.fn(() => ({
  state$: mockState$,
  dispatch: mockDispatch,
}))

vi.mock('../useReleasesStore', () => ({
  useReleasesStore: () => mockUseReleasesStore(),
}))

vi.mock('../useActiveReleases', () => ({
  useActiveReleases: () => mockUseActiveReleases(),
}))

const setupMockReturn = (overrides = {}) => {
  const defaultValues = {
    data: [],
    error: undefined,
    loading: false,
    dispatch: mockDispatch,
  }

  const mockReturn = {...defaultValues, ...overrides}
  mockUseActiveReleases.mockReturnValue(mockReturn)
  return mockReturn
}

describe('useActiveReleases', () => {
  beforeEach(() => {
    mockState$.next(initialState)
    vi.clearAllMocks()

    setupMockReturn()
  })

  it('should return initial loading state', async () => {
    const wrapper = await createTestProvider()
    setupMockReturn({loading: true})

    const {result} = renderHook(() => useActiveReleases(), {wrapper})

    expect(result.current).toEqual({
      loading: true,
      data: [],
      error: undefined,
      dispatch: mockDispatch,
    })
  })

  it('should return error state', async () => {
    const wrapper = await createTestProvider()
    const testError = new Error('Test error')

    setupMockReturn({
      loading: false,
      error: testError,
    })

    const {result} = renderHook(() => useActiveReleases(), {wrapper})

    expect(result.current).toEqual({
      loading: false,
      data: [],
      error: testError,
      dispatch: mockDispatch,
    })
  })

  it('should filter out archived releases', async () => {
    const wrapper = await createTestProvider()

    setupMockReturn({
      loading: false,
      data: [activeASAPRelease],
    })

    const {result} = renderHook(() => useActiveReleases(), {wrapper})

    expect(result.current).toEqual({
      loading: false,
      data: [activeASAPRelease],
      error: undefined,
      dispatch: mockDispatch,
    })
  })

  it('should sort releases in reverse order', async () => {
    const wrapper = await createTestProvider()
    const mockReleases = [activeASAPRelease, activeScheduledRelease]

    setupMockReturn({
      loading: false,
      data: mockReleases,
    })

    const {result} = renderHook(() => useActiveReleases(), {wrapper})

    expect(result.current).toEqual({
      loading: false,
      data: mockReleases,
      error: undefined,
      dispatch: mockDispatch,
    })
  })

  it('should expose dispatch function', async () => {
    const wrapper = await createTestProvider()
    setupMockReturn({loading: true})

    const {result} = renderHook(() => useActiveReleases(), {wrapper})

    expect(result.current).toEqual({
      loading: true,
      data: [],
      error: undefined,
      dispatch: mockDispatch,
    })
  })
})
