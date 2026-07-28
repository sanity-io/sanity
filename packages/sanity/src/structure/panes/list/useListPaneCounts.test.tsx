import {act, renderHook, waitFor} from '@testing-library/react'
import {Subject} from 'rxjs'
import {useDocumentPreviewStore, usePerspective} from 'sanity'
import {afterEach, beforeEach, describe, expect, it, type Mock, vi} from 'vitest'

import {type PaneListItem} from '../../types'
import {useListPaneCounts} from './useListPaneCounts'

vi.mock('sanity', () => ({
  useDocumentPreviewStore: vi.fn(),
  usePerspective: vi.fn(),
}))

const mockUseDocumentPreviewStore = useDocumentPreviewStore as Mock
const mockUsePerspective = usePerspective as Mock

function setTabVisibility(state: 'visible' | 'hidden') {
  Object.defineProperty(document, 'visibilityState', {configurable: true, get: () => state})
}

function listItem(id: string, filter: string): PaneListItem {
  return {type: 'listItem', id, title: id, count: {filter, params: {}}}
}

function flushTimers() {
  return act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 30))
  })
}

let countSubjects: Map<string, Subject<number>>
let observeDocumentCount: Mock

beforeEach(() => {
  vi.clearAllMocks()
  setTabVisibility('visible')
  countSubjects = new Map()
  observeDocumentCount = vi.fn((filter: string) => {
    const existing = countSubjects.get(filter)
    if (existing) return existing
    const subject = new Subject<number>()
    countSubjects.set(filter, subject)
    return subject
  })
  mockUseDocumentPreviewStore.mockReturnValue({
    unstable_observeDocumentCount: observeDocumentCount,
  })
  mockUsePerspective.mockReturnValue({perspectiveStack: ['drafts']})
})

afterEach(() => {
  setTabVisibility('visible')
})

describe('useListPaneCounts', () => {
  it('emits a record of counts from the observer emissions, keeping a resolved 0 as 0', async () => {
    const items = [listItem('author', '_type == "author"'), listItem('book', '_type == "book"')]
    const {result} = renderHook(() => useListPaneCounts(items, true))

    await waitFor(() => expect(observeDocumentCount).toHaveBeenCalled())

    // combineLatest holds until every descriptor emits, so nothing renders before the first resolve.
    expect(result.current).toEqual({})

    act(() => {
      countSubjects.get('_type == "author"')?.next(3)
      countSubjects.get('_type == "book"')?.next(0)
    })

    await waitFor(() => expect(result.current).toEqual({author: 3, book: 0}))
  })

  it('does not subscribe while disabled and returns the retained (empty) record', async () => {
    const items = [listItem('author', '_type == "author"')]
    const {result} = renderHook(() => useListPaneCounts(items, false))

    await flushTimers()

    expect(observeDocumentCount).not.toHaveBeenCalled()
    expect(result.current).toEqual({})
  })

  it('does not subscribe while the tab is hidden', async () => {
    setTabVisibility('hidden')
    const items = [listItem('author', '_type == "author"')]
    renderHook(() => useListPaneCounts(items, true))

    await flushTimers()

    expect(observeDocumentCount).not.toHaveBeenCalled()
  })

  it('retains the last resolved counts when it becomes inactive', async () => {
    const items = [listItem('author', '_type == "author"')]
    const {result, rerender} = renderHook(({enabled}) => useListPaneCounts(items, enabled), {
      initialProps: {enabled: true},
    })

    await waitFor(() => expect(observeDocumentCount).toHaveBeenCalled())
    act(() => {
      countSubjects.get('_type == "author"')?.next(5)
    })
    await waitFor(() => expect(result.current).toEqual({author: 5}))

    rerender({enabled: false})
    await flushTimers()

    expect(result.current).toEqual({author: 5})
  })
})
