import {describe, expect, it, jest} from '@jest/globals'
import {renderHook} from '@testing-library/react'

import {type BundleDocument, useBundles} from '../../../../store/bundles'
import {useGetBundleSlug} from '../useGetBundleSlug'

jest.mock('../../../../store/bundles', () => ({
  useBundles: jest.fn(),
}))

const mockUseBundles = useBundles as jest.Mock<typeof useBundles>

const generateMockUseBundles = (bundles: {slug: string}[] | null) => {
  mockUseBundles.mockReturnValue({
    data: bundles as BundleDocument[],
    loading: false,
    error: undefined,
    dispatch: jest.fn(),
    deletedBundles: {},
  })
}

describe('useGetBundleSlug', () => {
  it('should generate a new slug when there are no existing bundles', () => {
    generateMockUseBundles([])

    const {
      result: {current},
    } = renderHook(() => useGetBundleSlug())

    expect(current('New Bundle')).toBe('new-bundle')
  })

  it("should generate a new slug when the slug doesn' already exist", () => {
    generateMockUseBundles([{slug: 'test-bundle-1'}])

    const {
      result: {current},
    } = renderHook(() => useGetBundleSlug())

    expect(current('New Bundle')).toBe('new-bundle')
  })

  it('should generate a new slug with the correct suffix when similar slugs exist', () => {
    generateMockUseBundles([
      {slug: 'test-bundle'},
      {slug: 'test-bundle-1'},
      {slug: 'test-bundle-2'},
    ])

    const {
      result: {current},
    } = renderHook(() => useGetBundleSlug())

    expect(current('Test Bundle')).toBe('test-bundle-3')
  })

  it('should generate a new slug when a suffix count is already provided', () => {
    generateMockUseBundles([{slug: 'test-bundle-1'}])

    const {
      result: {current},
    } = renderHook(() => useGetBundleSlug())

    expect(current('Test Bundle 1')).toBe('test-bundle-1-1')
  })

  it('should handle protected slugs', () => {
    generateMockUseBundles([])

    const {
      result: {current},
    } = renderHook(() => useGetBundleSlug())

    expect(current('Drafts')).toBe('drafts-1')
    expect(current('published')).toBe('published-1')
  })

  it('should handle no bundles', () => {
    generateMockUseBundles(null)

    const {
      result: {current},
    } = renderHook(() => useGetBundleSlug())

    expect(current('New Bundle')).toBe('new-bundle')
  })
})
