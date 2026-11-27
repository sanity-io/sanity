import {act, renderHook} from '@testing-library/react'
import {afterEach, beforeEach, describe, expect, test, vi} from 'vitest'

import {type PresentationNavigate} from '../types'
import {useDocumentPanel} from '../useDocumentPanel'

describe('useDocumentPanel', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    localStorage.clear()
  })

  test('is open by default', () => {
    const {result} = renderHook(() => useDocumentPanel({navigate: vi.fn()}))

    expect(result.current.documentPanelOpen).toBe(true)
  })

  test('starts hidden when the default is closed', () => {
    const {result} = renderHook(() => useDocumentPanel({defaultOpen: false, navigate: vi.fn()}))

    expect(result.current.documentPanelOpen).toBe(false)
  })

  test('toggles between hidden and shown', () => {
    const {result} = renderHook(() => useDocumentPanel({navigate: vi.fn()}))

    act(() => result.current.toggleDocumentPanel())
    expect(result.current.documentPanelOpen).toBe(false)

    act(() => result.current.toggleDocumentPanel())
    expect(result.current.documentPanelOpen).toBe(true)
  })

  test('remembers a toggle across mounts, ahead of the default', () => {
    const first = renderHook(() => useDocumentPanel({navigate: vi.fn()}))
    act(() => first.result.current.toggleDocumentPanel())
    first.unmount()

    const second = renderHook(() => useDocumentPanel({navigate: vi.fn()}))
    expect(second.result.current.documentPanelOpen).toBe(false)
  })

  test('does not persist the default until the panel is toggled', () => {
    const first = renderHook(() => useDocumentPanel({defaultOpen: false, navigate: vi.fn()}))
    expect(first.result.current.documentPanelOpen).toBe(false)
    first.unmount()

    const second = renderHook(() => useDocumentPanel({defaultOpen: true, navigate: vi.fn()}))
    expect(second.result.current.documentPanelOpen).toBe(true)
  })

  describe('navigateToDocument', () => {
    test('opens a hidden panel and navigates when the state names a document', () => {
      const navigate = vi.fn<PresentationNavigate>()
      const {result} = renderHook(() => useDocumentPanel({defaultOpen: false, navigate}))

      act(() =>
        result.current.navigateToDocument({
          state: {type: 'product', id: 'product-1', path: 'title'},
        }),
      )

      expect(result.current.documentPanelOpen).toBe(true)
      expect(navigate).toHaveBeenCalledWith({
        state: {type: 'product', id: 'product-1', path: 'title'},
      })
    })

    test('leaves a hidden panel hidden when the navigation does not target a document', () => {
      const navigate = vi.fn<PresentationNavigate>()
      const {result} = renderHook(() => useDocumentPanel({defaultOpen: false, navigate}))

      act(() => result.current.navigateToDocument({params: {preview: 'https://example.com/'}}))
      act(() => result.current.navigateToDocument({state: {}}))

      expect(result.current.documentPanelOpen).toBe(false)
      expect(navigate).toHaveBeenCalledTimes(2)
    })
  })
})
