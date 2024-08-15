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
    } = renderHook(useGetBundleSlug)

    expect(current('New Bundle')).toEqual('new-bundle')
  })

  it("should generate a new slug when the slug doesn't already exist", () => {
    generateMockUseBundles([{slug: 'test-bundle-1'}])

    const {
      result: {current},
    } = renderHook(useGetBundleSlug)

    expect(current('New Bundle')).toEqual('new-bundle')
  })

  it.each([
    [[{slug: 'test-bundle'}], 'Test Bundle', 'test-bundle-1'],
    [[{slug: 'test-bundle'}], 'Test Bundle 3', 'test-bundle-3'],
    [
      [{slug: 'test-bundle'}, {slug: 'test-bundle-1'}, {slug: 'test-bundle-2'}],
      'Test Bundle',
      'test-bundle-3',
    ],
    [
      [{slug: 'test-bundle'}, {slug: 'test-bundle-3'}, {slug: 'test-bundle-2'}],
      'Test Bundle',
      'test-bundle-1',
    ],
    [[{slug: 'test-bundle-3'}, {slug: 'test-bundle-2'}], 'Test Bundle', 'test-bundle'],
  ])(
    'should generate the next lowest suffix when the slug already exists',
    (existingBundleSlugs, requestBundleTitle, resultSlug) => {
      generateMockUseBundles(existingBundleSlugs)

      const {
        result: {current},
      } = renderHook(useGetBundleSlug)

      expect(current(requestBundleTitle)).toEqual(resultSlug)
    },
  )

  it('should generate a new slug when a suffix count is already provided', () => {
    generateMockUseBundles([{slug: 'test-bundle-1-2'}])

    const {
      result: {current},
    } = renderHook(useGetBundleSlug)

    expect(current('Test Bundle 1 2')).toEqual('test-bundle-1-2-1')
  })

  it('should handle protected slugs', () => {
    generateMockUseBundles([])

    const {
      result: {current},
    } = renderHook(useGetBundleSlug)

    expect(current('Drafts')).toEqual('drafts-1')
    expect(current('published')).toEqual('published-1')
  })

  it('should handle no bundles', () => {
    generateMockUseBundles(null)

    const {
      result: {current},
    } = renderHook(useGetBundleSlug)

    expect(current('New Bundle')).toEqual('new-bundle')
  })
})
