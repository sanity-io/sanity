import {renderHook} from '@testing-library/react'
import {Subject} from 'rxjs'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {useCreatePathSyncChannel} from '../useCreatePathSyncChannel'

describe('useCreatePathSyncChannel', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })
  it('returns a Subject instance', () => {
    const {result} = renderHook(() => useCreatePathSyncChannel())
    expect(result.current).toBeInstanceOf(Subject)
  })

  it('returns the same instance between renders', () => {
    const {result, rerender} = renderHook(() => useCreatePathSyncChannel())
    const first = result.current
    rerender()
    expect(result.current).toBe(first)
  })
})
