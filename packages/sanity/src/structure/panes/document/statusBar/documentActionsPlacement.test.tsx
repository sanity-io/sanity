import {renderHook} from '@testing-library/react'
import {type ReactNode} from 'react'
import {describe, expect, it} from 'vitest'

import {
  DocumentActionsPlacementProvider,
  getMirroredEndPlacement,
  getMirroredFallbackPlacements,
  getMirroredPlacement,
  useDocumentActionsPlacement,
} from './documentActionsPlacement'

function TopPlacementWrapper({children}: {children: ReactNode}) {
  return (
    <DocumentActionsPlacementProvider placement="top">{children}</DocumentActionsPlacementProvider>
  )
}

describe('useDocumentActionsPlacement', () => {
  it('defaults to bottom when no provider is mounted', () => {
    const {result} = renderHook(() => useDocumentActionsPlacement())

    expect(result.current).toBe('bottom')
  })

  it('reflects the placement supplied by DocumentActionsPlacementProvider', () => {
    const {result} = renderHook(() => useDocumentActionsPlacement(), {
      wrapper: TopPlacementWrapper,
    })

    expect(result.current).toBe('top')
  })
})

describe('getMirroredPlacement', () => {
  it('keeps the bottom-bar (default) popovers opening upward', () => {
    expect(getMirroredPlacement('bottom')).toBe('top')
  })

  it('flips top-bar popovers to open downward', () => {
    expect(getMirroredPlacement('top')).toBe('bottom')
  })
})

describe('getMirroredEndPlacement', () => {
  it('keeps the bottom-bar (default) action menu opening upward', () => {
    expect(getMirroredEndPlacement('bottom')).toBe('top-end')
  })

  it('flips the top-bar action menu to open downward', () => {
    expect(getMirroredEndPlacement('top')).toBe('bottom-end')
  })
})

describe('getMirroredFallbackPlacements', () => {
  it('keeps the bottom-bar (default) fallback order unchanged', () => {
    expect(getMirroredFallbackPlacements('bottom')).toEqual(['left', 'bottom'])
  })

  it('flips the top-bar fallback order to favor top', () => {
    expect(getMirroredFallbackPlacements('top')).toEqual(['left', 'top'])
  })
})
