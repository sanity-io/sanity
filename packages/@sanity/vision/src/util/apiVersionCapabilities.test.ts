import {describe, expect, it, vi} from 'vitest'

import {
  API_VERSION_CAPABILITIES,
  getUnsatisfiedApiVersionCapability,
  hasReleaseInPerspective,
} from './apiVersionCapabilities'

const sanityMocks = vi.hoisted(() => ({
  releasesApiVersion: 'v2099-01-01',
  variantsApiVersion: 'X',
}))

vi.mock('sanity', () => ({
  RELEASES_STUDIO_CLIENT_OPTIONS: {apiVersion: sanityMocks.releasesApiVersion},
  VARIANTS_STUDIO_CLIENT_OPTIONS: {apiVersion: sanityMocks.variantsApiVersion},
}))

const releaseStack = ['rapp2157', 'drafts'] as const

describe('hasReleaseInPerspective', () => {
  it('is false for named perspectives and published or drafts stacks', () => {
    expect(hasReleaseInPerspective(undefined)).toBe(false)
    expect(hasReleaseInPerspective('published')).toBe(false)
    expect(hasReleaseInPerspective('drafts')).toBe(false)
    expect(hasReleaseInPerspective('raw')).toBe(false)
    expect(hasReleaseInPerspective(['published'])).toBe(false)
    expect(hasReleaseInPerspective(['drafts'])).toBe(false)
    expect(hasReleaseInPerspective(['published', 'drafts'])).toBe(false)
  })

  it('is true when the stack contains a release id', () => {
    expect(hasReleaseInPerspective(['rapp2157', 'drafts'])).toBe(true)
    expect(hasReleaseInPerspective(['scheduledDraft1', 'published'])).toBe(true)
  })
})

describe('API_VERSION_CAPABILITIES', () => {
  it('reads required versions from the studio client constants', () => {
    expect(API_VERSION_CAPABILITIES.map((capability) => capability.id)).toEqual([
      'variants',
      'releases',
    ])
    expect(API_VERSION_CAPABILITIES[0]?.requiredApiVersion).toBe(sanityMocks.variantsApiVersion)
    expect(API_VERSION_CAPABILITIES[1]?.requiredApiVersion).toBe(sanityMocks.releasesApiVersion)
  })
})

describe('getUnsatisfiedApiVersionCapability', () => {
  it('returns the releases capability for a 400 with a release stack on an older dated version', () => {
    const capability = getUnsatisfiedApiVersionCapability({
      statusCode: 400,
      apiVersion: 'v2021-03-25',
      perspective: [...releaseStack],
      variant: undefined,
    })

    expect(capability?.id).toBe('releases')
    expect(capability?.requiredApiVersion).toBe(sanityMocks.releasesApiVersion)
    expect(capability?.explanationKey).toBe('query.error.unsupported-release-perspective')
  })

  it('prefers the variant capability when a query carries both a variant and a release stack', () => {
    const capability = getUnsatisfiedApiVersionCapability({
      statusCode: 400,
      apiVersion: 'v2021-03-25',
      perspective: [...releaseStack],
      variant: 'french',
    })

    expect(capability?.id).toBe('variants')
    expect(capability?.requiredApiVersion).toBe(sanityMocks.variantsApiVersion)
    expect(capability?.explanationKey).toBe('query.error.unsupported-variant')
  })

  it('does not return a capability when the selected version satisfies the variant floor', () => {
    expect(
      getUnsatisfiedApiVersionCapability({
        statusCode: 400,
        apiVersion: 'vX',
        perspective: [...releaseStack],
        variant: 'french',
      }),
    ).toBeUndefined()
  })

  it('returns the variant capability when a dated version is below the variants floor', () => {
    const capability = getUnsatisfiedApiVersionCapability({
      statusCode: 400,
      apiVersion: 'v2030-01-01',
      perspective: ['published'],
      variant: 'french',
    })

    expect(capability?.id).toBe('variants')
    expect(capability?.requiredApiVersion).toBe(sanityMocks.variantsApiVersion)
  })

  it('is undefined when the status is not 400', () => {
    expect(
      getUnsatisfiedApiVersionCapability({
        statusCode: 403,
        apiVersion: 'v2021-03-25',
        perspective: [...releaseStack],
        variant: undefined,
      }),
    ).toBeUndefined()
  })

  it('is undefined for published or drafts stacks without a variant', () => {
    expect(
      getUnsatisfiedApiVersionCapability({
        statusCode: 400,
        apiVersion: 'v2021-03-25',
        perspective: ['published'],
        variant: undefined,
      }),
    ).toBeUndefined()
  })

  it('is undefined when the selected dated version meets the releases floor', () => {
    expect(
      getUnsatisfiedApiVersionCapability({
        statusCode: 400,
        apiVersion: sanityMocks.releasesApiVersion,
        perspective: [...releaseStack],
        variant: undefined,
      }),
    ).toBeUndefined()
  })
})
