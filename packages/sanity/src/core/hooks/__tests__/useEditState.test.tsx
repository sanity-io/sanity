import {act, renderHook, waitFor} from '@testing-library/react'
import {BehaviorSubject} from 'rxjs'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {type EditStateFor} from '../../store'
import {useEditState} from '../useEditState'

const initialState: EditStateFor = {
  id: 'doc-1',
  type: 'book',
  transactionSyncLock: null,
  draft: null,
  published: null,
  version: null,
  liveEdit: false,
  liveEditSchemaType: false,
  ready: false,
  release: undefined,
}

const mockEditState$ = new BehaviorSubject<EditStateFor>(initialState)
const mockEditStateFn = vi.fn(() => mockEditState$)

const mockDocumentStore = {
  pair: {editState: mockEditStateFn},
}

vi.mock('../../store', () => ({
  useDocumentStore: () => mockDocumentStore,
}))

describe('useEditState', () => {
  beforeEach(() => {
    mockEditState$.next(initialState)
    mockEditStateFn.mockClear()
  })

  it('returns the initial value', () => {
    const {result} = renderHook(() => useEditState('doc-1', 'book'))
    expect(result.current).toBe(initialState)
  })

  it('dedupes re-emissions where the snapshot fields keep their references', () => {
    const {result} = renderHook(() => useEditState('doc-1', 'book'))
    const before = result.current

    act(() => {
      mockEditState$.next({...initialState})
    })

    expect(result.current).toBe(before)
  })

  it('passes through when a snapshot reference changes', async () => {
    const {result} = renderHook(() => useEditState('doc-1', 'book'))

    const next: EditStateFor = {
      ...initialState,
      ready: true,
      draft: {
        _id: 'drafts.doc-1',
        _type: 'book',
        _rev: 'r1',
        _createdAt: '2024-01-01T00:00:00Z',
        _updatedAt: '2024-01-01T00:00:00Z',
      },
    }

    act(() => {
      mockEditState$.next(next)
    })

    await waitFor(() => {
      expect(result.current).toBe(next)
    })
  })

  it('passes through when only the `ready` flag flips', async () => {
    const {result} = renderHook(() => useEditState('doc-1', 'book'))

    const next: EditStateFor = {...initialState, ready: true}
    act(() => {
      mockEditState$.next(next)
    })

    await waitFor(() => {
      expect(result.current).toBe(next)
    })
  })

  it('treats a new draft reference as a change even if content is equivalent', async () => {
    const draft = {
      _id: 'drafts.doc-1',
      _type: 'book',
      _rev: 'r1',
      _createdAt: '2024-01-01T00:00:00Z',
      _updatedAt: '2024-01-01T00:00:00Z',
      title: 'hello',
    }
    const seeded: EditStateFor = {...initialState, ready: true, draft}

    act(() => {
      mockEditState$.next(seeded)
    })

    const {result} = renderHook(() => useEditState('doc-1', 'book'))

    act(() => {
      mockEditState$.next({...seeded})
    })
    expect(result.current).toBe(seeded)

    const cloned: EditStateFor = {...seeded, draft: {...draft}}
    act(() => {
      mockEditState$.next(cloned)
    })

    await waitFor(() => {
      expect(result.current).toBe(cloned)
    })
  })
})
