import {act, renderHook, waitFor} from '@testing-library/react'
import {BehaviorSubject} from 'rxjs'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {
  RELEASE_SETTINGS_DOCUMENT_ID,
  RELEASE_SETTINGS_DOCUMENT_TYPE,
} from '../releaseSettingsConstants'

interface MockState {
  document: unknown
  loading: boolean
  error: Error | null
}

const INITIAL_MOCK_STATE: MockState = {document: null, loading: true, error: null}
const createOrReplaceMock = vi.fn(async (document: unknown) => document)
const stateSubject = new BehaviorSubject<MockState>(INITIAL_MOCK_STATE)

vi.mock('../../../hooks', () => ({
  useClient: () => ({createOrReplace: createOrReplaceMock}),
}))

vi.mock('../../../store', () => ({
  useResourceCache: () => ({get: () => undefined, set: () => undefined}),
}))

vi.mock('../createReleaseSettingsStore', () => ({
  createReleaseSettingsStore: () => ({state$: stateSubject.asObservable()}),
  INITIAL_RELEASE_SETTINGS_STATE: {document: null, loading: true, error: null},
}))

import {useReleaseSettings} from '../useReleaseSettings'

describe('useReleaseSettings', () => {
  beforeEach(() => {
    createOrReplaceMock.mockClear()
    stateSubject.next(INITIAL_MOCK_STATE)
  })

  it('starts with empty sections + loading state', () => {
    const {result} = renderHook(() => useReleaseSettings())
    expect(result.current.descriptionSections).toEqual([])
    expect(result.current.loading).toBe(true)
    expect(result.current.error).toBeNull()
  })

  it('reflects the persisted descriptionSections when the store emits', async () => {
    const {result} = renderHook(() => useReleaseSettings())

    act(() => {
      stateSubject.next({
        document: {
          _id: RELEASE_SETTINGS_DOCUMENT_ID,
          _rev: 'rev-1',
          _type: RELEASE_SETTINGS_DOCUMENT_TYPE,
          descriptionSections: [{title: 'Overview'}, {title: 'Changes'}],
        },
        loading: false,
        error: null,
      })
    })

    await waitFor(() => {
      expect(result.current.descriptionSections).toEqual([{title: 'Overview'}, {title: 'Changes'}])
    })
    expect(result.current.loading).toBe(false)
  })

  it('setDescriptionSections issues createOrReplace with the right shape', async () => {
    const {result} = renderHook(() => useReleaseSettings())
    await result.current.setDescriptionSections([{title: 'Overview'}, {title: 'Risks'}])

    expect(createOrReplaceMock).toHaveBeenCalledTimes(1)
    expect(createOrReplaceMock).toHaveBeenCalledWith({
      _id: RELEASE_SETTINGS_DOCUMENT_ID,
      _type: RELEASE_SETTINGS_DOCUMENT_TYPE,
      descriptionSections: [{title: 'Overview'}, {title: 'Risks'}],
    })
  })
})
