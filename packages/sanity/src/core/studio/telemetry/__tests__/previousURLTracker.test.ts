import {describe, expect, it} from 'vitest'

import {createPreviousURLTracker} from '../previousURLTracker'

const STRUCTURE_URL = 'https://test-studio.sanity.dev/test/structure/book'
const RELEASES_URL = 'https://test-studio.sanity.dev/test/releases'

describe('createPreviousURLTracker', () => {
  it('returns the URL the browser left for a URL', () => {
    const tracker = createPreviousURLTracker()

    tracker.record(STRUCTURE_URL, RELEASES_URL)

    expect(tracker.get(RELEASES_URL)).toBe(STRUCTURE_URL)
  })

  it('keeps the URL the browser left when a tool replaces its URL with itself on mount', () => {
    const tracker = createPreviousURLTracker()

    tracker.record(STRUCTURE_URL, RELEASES_URL)
    tracker.record(RELEASES_URL, RELEASES_URL)
    tracker.record(RELEASES_URL, RELEASES_URL)

    expect(tracker.get(RELEASES_URL)).toBe(STRUCTURE_URL)
  })

  it('forgets the oldest URLs past 50', () => {
    const tracker = createPreviousURLTracker()

    Array.from({length: 51}, (_, index) => index).forEach((index) =>
      tracker.record(STRUCTURE_URL, `${RELEASES_URL}/r${index}`),
    )

    expect(tracker.get(`${RELEASES_URL}/r0`)).toBeUndefined()
    expect(tracker.get(`${RELEASES_URL}/r50`)).toBe(STRUCTURE_URL)
  })
})
