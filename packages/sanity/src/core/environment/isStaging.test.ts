import {afterEach, describe, expect, it, vi} from 'vitest'

vi.mock('./importMap', () => ({
  getSanityImportMapUrl: vi.fn(),
}))

afterEach(() => {
  vi.resetModules()
  vi.restoreAllMocks()
  // @ts-expect-error: __SANITY_STAGING__ is a global env variable
  delete globalThis.__SANITY_STAGING__
})

async function loadIsStaging(): Promise<boolean> {
  const mod = await import('./isStaging')
  return mod.isStaging
}

describe('isStaging', () => {
  it('should return false when no staging signals are present', async () => {
    const {getSanityImportMapUrl} = await import('./importMap')
    vi.mocked(getSanityImportMapUrl).mockReturnValue(undefined)
    expect(await loadIsStaging()).toBe(false)
  })

  it('should return true when __SANITY_STAGING__ is true', async () => {
    // @ts-expect-error: __SANITY_STAGING__ is a global env variable
    globalThis.__SANITY_STAGING__ = true
    expect(await loadIsStaging()).toBe(true)
  })

  it('should return false when __SANITY_STAGING__ is false', async () => {
    // @ts-expect-error: __SANITY_STAGING__ is a global env variable
    globalThis.__SANITY_STAGING__ = false
    const {getSanityImportMapUrl} = await import('./importMap')
    vi.mocked(getSanityImportMapUrl).mockReturnValue(undefined)
    expect(await loadIsStaging()).toBe(false)
  })

  it('should return true when import map points to staging CDN', async () => {
    const {getSanityImportMapUrl} = await import('./importMap')
    vi.mocked(getSanityImportMapUrl).mockReturnValue(
      'https://sanity-cdn.work/v1/modules/by-app/abc123/sanity',
    )
    expect(await loadIsStaging()).toBe(true)
  })

  it('should return false when import map points to production CDN', async () => {
    const {getSanityImportMapUrl} = await import('./importMap')
    vi.mocked(getSanityImportMapUrl).mockReturnValue(
      'https://sanity-cdn.com/v1/modules/by-app/abc123/sanity',
    )
    expect(await loadIsStaging()).toBe(false)
  })

  it('should return true when both build-time flag and import map indicate staging', async () => {
    // @ts-expect-error: __SANITY_STAGING__ is a global env variable
    globalThis.__SANITY_STAGING__ = true
    const {getSanityImportMapUrl} = await import('./importMap')
    vi.mocked(getSanityImportMapUrl).mockReturnValue(
      'https://sanity-cdn.work/v1/modules/by-app/abc123/sanity',
    )
    expect(await loadIsStaging()).toBe(true)
  })
})
