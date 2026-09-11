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

function listItem(id: string, typeName: string = id): PaneListItem {
  return {type: 'listItem', id, title: id, count: {type: typeName}}
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
  observeDocumentCount = vi.fn((filter: string, params: {type: string}) => {
    expect(filter).toBe('_type == $type')
    const existing = countSubjects.get(params.type)
    if (existing) return existing
    const subject = new Subject<number>()
    countSubjects.set(params.type, subject)
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
  it('authors the whole-type filter itself, from the type the descriptor names', async () => {
    const items = [listItem('featured-authors', 'author')]
    renderHook(() => useListPaneCounts(items, true))

    await waitFor(() => expect(observeDocumentCount).toHaveBeenCalled())

    expect(observeDocumentCount).toHaveBeenCalledWith(
      '_type == $type',
      {type: 'author'},
      ['drafts'],
      {tag: 'structure.list-pane-counts'},
    )
  })

  it('emits a record of counts from the observer emissions, keeping a resolved 0 as 0', async () => {
    const items = [listItem('author'), listItem('book')]
    const {result} = renderHook(() => useListPaneCounts(items, true))

    await waitFor(() => expect(observeDocumentCount).toHaveBeenCalled())

    // combineLatest holds until every descriptor emits, so nothing renders before the first resolve.
    expect(result.current).toEqual({})

    act(() => {
      countSubjects.get('author')?.next(3)
      countSubjects.get('book')?.next(0)
    })

    await waitFor(() => expect(result.current).toEqual({author: 3, book: 0}))
  })

  it('does not subscribe while disabled and returns the retained (empty) record', async () => {
    const items = [listItem('author')]
    const {result} = renderHook(() => useListPaneCounts(items, false))

    await flushTimers()

    expect(observeDocumentCount).not.toHaveBeenCalled()
    expect(result.current).toEqual({})
  })

  it('does not subscribe while the tab is hidden', async () => {
    setTabVisibility('hidden')
    const items = [listItem('author')]
    renderHook(() => useListPaneCounts(items, true))

    await flushTimers()

    expect(observeDocumentCount).not.toHaveBeenCalled()
  })

  it('retains the last resolved counts when it becomes inactive', async () => {
    const items = [listItem('author')]
    const {result, rerender} = renderHook(({enabled}) => useListPaneCounts(items, enabled), {
      initialProps: {enabled: true},
    })

    await waitFor(() => expect(observeDocumentCount).toHaveBeenCalled())
    act(() => {
      countSubjects.get('author')?.next(5)
    })
    await waitFor(() => expect(result.current).toEqual({author: 5}))

    rerender({enabled: false})
    await flushTimers()

    expect(result.current).toEqual({author: 5})
  })

  it('drops a resolved count once the item stops carrying a count descriptor', async () => {
    const withCount = [listItem('author')]
    const {result, rerender} = renderHook(({items}) => useListPaneCounts(items, true), {
      initialProps: {items: withCount},
    })

    await waitFor(() => expect(observeDocumentCount).toHaveBeenCalled())
    act(() => {
      countSubjects.get('author')?.next(5)
    })
    await waitFor(() => expect(result.current).toEqual({author: 5}))

    const withoutCount: PaneListItem[] = [{type: 'listItem', id: 'author', title: 'author'}]
    rerender({items: withoutCount})
    await flushTimers()

    expect(result.current).toEqual({})
  })
})
