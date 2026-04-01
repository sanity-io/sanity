import {afterEach, describe, expect, it, vi} from 'vitest'

import * as importMap from './importMap'
import {isStaging} from './isStaging'

const getSanityImportMapUrlSpy = vi.spyOn(importMap, 'getSanityImportMapUrl')

afterEach(() => {
  getSanityImportMapUrlSpy.mockReset()
  // Clean up any global __SANITY_STAGING__ we may have set
  // @ts-expect-error: __SANITY_STAGING__ is a global env variable
  delete globalThis.__SANITY_STAGING__
})

describe('isStaging', () => {
  it('should return false when no staging signals are present', () => {
    getSanityImportMapUrlSpy.mockReturnValue(undefined)
    expect(isStaging()).toBe(false)
  })

  it('should return true when __SANITY_STAGING__ is true', () => {
    // @ts-expect-error: __SANITY_STAGING__ is a global env variable
    globalThis.__SANITY_STAGING__ = true
    getSanityImportMapUrlSpy.mockReturnValue(undefined)
    expect(isStaging()).toBe(true)
  })

  it('should return false when __SANITY_STAGING__ is false', () => {
    // @ts-expect-error: __SANITY_STAGING__ is a global env variable
    globalThis.__SANITY_STAGING__ = false
    getSanityImportMapUrlSpy.mockReturnValue(undefined)
    expect(isStaging()).toBe(false)
  })

  it('should return true when import map points to staging CDN', () => {
    getSanityImportMapUrlSpy.mockReturnValue(
      'https://sanity-cdn.work/v1/modules/by-app/abc123/sanity',
    )
    expect(isStaging()).toBe(true)
  })

  it('should return false when import map points to production CDN', () => {
    getSanityImportMapUrlSpy.mockReturnValue(
      'https://sanity-cdn.com/v1/modules/by-app/abc123/sanity',
    )
    expect(isStaging()).toBe(false)
  })

  it('should return true when both build-time flag and import map indicate staging', () => {
    // @ts-expect-error: __SANITY_STAGING__ is a global env variable
    globalThis.__SANITY_STAGING__ = true
    getSanityImportMapUrlSpy.mockReturnValue(
      'https://sanity-cdn.work/v1/modules/by-app/abc123/sanity',
    )
    expect(isStaging()).toBe(true)
  })
})
