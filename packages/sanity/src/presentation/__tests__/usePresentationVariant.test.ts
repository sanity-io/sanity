import {renderHook} from '@testing-library/react'
import {type PerspectiveContextValue} from 'sanity'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {usePresentationVariant} from '../usePresentationVariant'

const mockUsePerspective = vi.fn()

vi.mock('sanity', async (importOriginal) => ({
  ...(await importOriginal()),
  usePerspective: () => mockUsePerspective(),
}))

describe('usePresentationVariant', () => {
  beforeEach(() => {
    mockUsePerspective.mockReset()
  })

  it('should return the selected variant name as-is (bare variant id)', () => {
    mockUsePerspective.mockReturnValue({
      selectedVariantName: 'Ab12cd34',
    } satisfies Partial<PerspectiveContextValue>)

    const {result} = renderHook(() => usePresentationVariant())

    expect(result.current).toBe('Ab12cd34')
  })

  it('should return undefined when no variant is selected', () => {
    mockUsePerspective.mockReturnValue({
      selectedVariantName: undefined,
    } satisfies Partial<PerspectiveContextValue>)

    const {result} = renderHook(() => usePresentationVariant())

    expect(result.current).toBeUndefined()
  })
})
