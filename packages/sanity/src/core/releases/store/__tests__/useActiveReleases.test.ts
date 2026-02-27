import {type ReleaseDocument} from '@sanity/client'
import {act, renderHook, waitFor} from '@testing-library/react'
import {BehaviorSubject} from 'rxjs'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {createTestProvider} from '../../../../../test/testUtils/TestProvider'
import {
  activeASAPRelease,
  activeScheduledRelease,
  archivedScheduledRelease,
} from '../../__fixtures__/release.fixture'
import {useActiveReleases} from '../useActiveReleases'

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

describe('useActiveReleases', () => {
  beforeEach(() => {
    mockState$.next(initialState)
    vi.clearAllMocks()
  })

  it('should return initial loading state', async () => {
    const wrapper = await createTestProvider()
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
    const {result} = renderHook(() => useActiveReleases(), {wrapper})

    const testError = new Error('Test error')
    act(() => {
      mockState$.next({
        releases: new Map(),
        error: testError,
        state: 'error',
      })
    })

    await waitFor(() => {
      expect(result.current).toEqual({
        loading: false,
        data: [],
        error: testError,
        dispatch: mockDispatch,
      })
    })
  })

  it('should filter out archived releases', async () => {
    const wrapper = await createTestProvider()
    const {result} = renderHook(() => useActiveReleases(), {wrapper})

    const mockReleases = [activeASAPRelease, archivedScheduledRelease]

    act(() => {
      mockState$.next({
        releases: new Map(mockReleases.map((release) => [release._id, release])),
        error: undefined,
        state: 'loaded',
      })
    })

    await waitFor(() => {
      expect(result.current).toEqual({
        loading: false,
        data: [activeASAPRelease],
        error: undefined,
        dispatch: mockDispatch,
      })
    })
  })

  it('should sort releases in reverse order', async () => {
    const wrapper = await createTestProvider()
    const {result} = renderHook(() => useActiveReleases(), {wrapper})

    const mockReleases = [activeASAPRelease, activeScheduledRelease]

    act(() => {
      mockState$.next({
        releases: new Map(mockReleases.map((release) => [release._id, release])),
        error: undefined,
        state: 'loaded',
      })
    })

    await waitFor(() => {
      expect(result.current).toEqual({
        loading: false,
        data: mockReleases,
        error: undefined,
        dispatch: mockDispatch,
      })
    })
  })

  it('should expose dispatch function', async () => {
    const wrapper = await createTestProvider()
    const {result} = renderHook(() => useActiveReleases(), {wrapper})

    expect(result.current).toEqual({
      loading: true,
      data: [],
      error: undefined,
      dispatch: mockDispatch,
    })
  })
})
