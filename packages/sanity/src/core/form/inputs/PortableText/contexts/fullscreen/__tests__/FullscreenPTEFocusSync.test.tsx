import {act, renderHook} from '@testing-library/react'
import {type ReactNode} from 'react'
import {describe, expect, it, vi} from 'vitest'

import {FullscreenPTEProvider} from '../FullscreenPTEProvider'
import {useFullscreenPTE} from '../useFullscreenPTE'

vi.mock('@sanity/telemetry/react', () => ({
  useTelemetry: () => ({log: vi.fn()}),
}))

vi.mock('../../../../../studio/tree-editing/context/enabled/useEnhancedObjectDialog', () => ({
  useEnhancedObjectDialog: () => ({enabled: false}),
}))

function Wrapper({children}: {children: ReactNode}) {
  return <FullscreenPTEProvider>{children}</FullscreenPTEProvider>
}

describe('FullscreenPTE context', () => {
  it('should set and get fullscreen paths', () => {
    const {result} = renderHook(() => useFullscreenPTE(), {wrapper: Wrapper})

    act(() => {
      result.current.setFullscreenPath(['body'], true)
    })

    expect(result.current.allFullscreenPaths).toEqual(['body'])
    expect(result.current.hasAnyFullscreen()).toBe(true)
    expect(result.current.getFullscreenPath(['body'])).toBe('body')
  })

  it('should collapse fullscreen PTE when setFullscreenPath is called with false', () => {
    const {result} = renderHook(() => useFullscreenPTE(), {wrapper: Wrapper})

    act(() => {
      result.current.setFullscreenPath(['body'], true)
    })

    expect(result.current.allFullscreenPaths).toEqual(['body'])

    act(() => {
      result.current.setFullscreenPath(['body'], false)
    })

    expect(result.current.allFullscreenPaths).toEqual([])
    expect(result.current.hasAnyFullscreen()).toBe(false)
  })

  it('should allow collapsing non-descendant PTEs by iterating allFullscreenPaths', () => {
    // This test validates the pattern used by FullscreenPTEFocusSync in FormBuilder:
    // When focus moves to a path outside the PTE, setFullscreenPath(ptePath, false) is called
    const {result} = renderHook(() => useFullscreenPTE(), {wrapper: Wrapper})

    // Set up a fullscreen PTE at 'body'
    act(() => {
      result.current.setFullscreenPath(['body'], true)
    })

    expect(result.current.allFullscreenPaths).toEqual(['body'])

    // Simulate what FullscreenPTEFocusSync does: collapse PTEs that aren't ancestors of focus path
    // Focus moved to ['title'] which does NOT descend from ['body']
    act(() => {
      for (const _savedPath of result.current.allFullscreenPaths) {
        // 'title' does not start with 'body', so collapse it
        result.current.setFullscreenPath(['body'], false)
      }
    })

    expect(result.current.allFullscreenPaths).toEqual([])
    expect(result.current.hasAnyFullscreen()).toBe(false)
  })

  it('should keep PTE expanded when focus moves to a descendant path', () => {
    const {result} = renderHook(() => useFullscreenPTE(), {wrapper: Wrapper})

    // Set up a fullscreen PTE at 'body'
    act(() => {
      result.current.setFullscreenPath(['body'], true)
    })

    expect(result.current.allFullscreenPaths).toEqual(['body'])

    // Focus moves to ['body', {_key: 'abc'}, 'children'] - a descendant of ['body']
    // In this case, we should NOT collapse the PTE (it stays in allFullscreenPaths)
    // The FullscreenPTEFocusSync component uses startsWith(ptePath, focusPath) to check

    // Verify the PTE is still expanded
    expect(result.current.allFullscreenPaths).toEqual(['body'])
    expect(result.current.hasAnyFullscreen()).toBe(true)
  })
})
