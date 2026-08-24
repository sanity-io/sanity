import {describe, expect, it} from 'vitest'

import {
  hasReleaseInPerspective,
  isApiVersionBelow,
  isIncompatibleReleasePerspectiveError,
} from './isIncompatibleReleasePerspectiveError'

const MINIMUM = 'v2025-02-19'

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

describe('isApiVersionBelow', () => {
  it('treats v1 and dated versions before the cutoff as below', () => {
    expect(isApiVersionBelow('v1', MINIMUM)).toBe(true)
    expect(isApiVersionBelow('v2021-03-25', MINIMUM)).toBe(true)
    expect(isApiVersionBelow('v2022-03-07', MINIMUM)).toBe(true)
    expect(isApiVersionBelow('2024-01-01', MINIMUM)).toBe(true)
  })

  it('treats the cutoff, later dated versions, and vX as not below', () => {
    expect(isApiVersionBelow('v2025-02-19', MINIMUM)).toBe(false)
    expect(isApiVersionBelow('v2026-01-01', MINIMUM)).toBe(false)
    expect(isApiVersionBelow('vX', MINIMUM)).toBe(false)
  })

  it('does not treat unparseable versions as below', () => {
    expect(isApiVersionBelow('other', MINIMUM)).toBe(false)
    expect(isApiVersionBelow('', MINIMUM)).toBe(false)
  })
})

describe('isIncompatibleReleasePerspectiveError', () => {
  const releaseStack = ['rapp2157', 'drafts'] as const

  it('is true for a 400 with a release stack on an old API version', () => {
    expect(
      isIncompatibleReleasePerspectiveError({
        statusCode: 400,
        apiVersion: 'v2021-03-25',
        perspective: [...releaseStack],
        minimumApiVersion: MINIMUM,
      }),
    ).toBe(true)
  })

  it('does not read or require an error message', () => {
    expect(
      isIncompatibleReleasePerspectiveError({
        statusCode: 400,
        apiVersion: 'v1',
        perspective: [...releaseStack],
        minimumApiVersion: MINIMUM,
      }),
    ).toBe(true)
  })

  it('is false when the status is not 400', () => {
    expect(
      isIncompatibleReleasePerspectiveError({
        statusCode: 403,
        apiVersion: 'v2021-03-25',
        perspective: [...releaseStack],
        minimumApiVersion: MINIMUM,
      }),
    ).toBe(false)
  })

  it('is false for published or drafts stacks on old API versions', () => {
    expect(
      isIncompatibleReleasePerspectiveError({
        statusCode: 400,
        apiVersion: 'v2021-03-25',
        perspective: ['published'],
        minimumApiVersion: MINIMUM,
      }),
    ).toBe(false)
  })

  it('is false when the selected version is at or above the cutoff', () => {
    expect(
      isIncompatibleReleasePerspectiveError({
        statusCode: 400,
        apiVersion: 'v2025-02-19',
        perspective: [...releaseStack],
        minimumApiVersion: MINIMUM,
      }),
    ).toBe(false)
  })
})
