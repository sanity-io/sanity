import {firstValueFrom} from 'rxjs'
import {describe, expect, test as base} from 'vitest'

import {
  type Storage,
  type HintStatus,
  hintStatus,
  sessionCountToStatus,
  suppressHint,
} from './hintStatus'

interface InMemoryBrowserStorageAdapter {
  /** The storage adapter passed to `hintStatus`. */
  readonly adapter: Storage
  /** The persisted session count, mirroring the value held in `localStorage`. */
  getCount: () => number
  /**
   * Simulate the start of a fresh browser session by clearing the
   * session-scoped state, mirroring how `sessionStorage` is reset.
   */
  startNewSession: () => void
}

/**
 * An in-memory stand-in for `browserStorageAdapter`. The session count is
 * persisted across sessions (like `localStorage`), whereas the "has displayed"
 * flag is scoped to a single session (like `sessionStorage`).
 */
function createInMemoryBrowserStorageAdapter(): InMemoryBrowserStorageAdapter {
  let count = 0
  let hasDisplayed = false

  return {
    adapter: {
      readCount: async () => count,
      writeCount: async (value) => {
        count = value
      },
      readHasDisplayed: async () => hasDisplayed,
      writeHasDisplayed: async (value) => {
        hasDisplayed = value
      },
    },
    getCount: () => count,
    startNewSession: () => {
      hasDisplayed = false
    },
  }
}

interface HintStatusFixtures {
  /**
   * Fresh in-memory storage, scoped to a single test.
   */
  storage: InMemoryBrowserStorageAdapter
  /**
   * Start a brand new session and resolve the resulting hint status.
   */
  displayHintInNewSession: () => Promise<HintStatus>
}

const test = base.extend<HintStatusFixtures>({
  // oxlint-disable-next-line no-empty-pattern
  storage: async ({}, consume) => {
    await consume(createInMemoryBrowserStorageAdapter())
  },
  displayHintInNewSession: async ({storage}, consume) => {
    await consume(async () => {
      storage.startNewSession()
      return firstValueFrom(hintStatus(storage.adapter))
    })
  },
})

test('is active when the hint has been displayed for fewer than three sessions', async ({
  storage,
  displayHintInNewSession,
}) => {
  expect(await displayHintInNewSession()).toBe('active')
  expect(storage.getCount()).toBe(1)

  expect(await displayHintInNewSession()).toBe('active')
  expect(storage.getCount()).toBe(2)
})

test('remains active until the session count exceeds the limit, then stops incrementing the count', async ({
  storage,
  displayHintInNewSession,
}) => {
  // The count is incremented on every session while the hint is active, up to
  // and including the session in which the count reaches the limit.
  expect(await displayHintInNewSession()).toBe('active')
  expect(await displayHintInNewSession()).toBe('active')
  expect(await displayHintInNewSession()).toBe('active')
  expect(await displayHintInNewSession()).toBe('active')
  expect(storage.getCount()).toBe(4)

  // Once the count exceeds the limit the hint becomes inactive, and the count
  // is no longer incremented.
  expect(await displayHintInNewSession()).toBe('inactive')
  expect(await displayHintInNewSession()).toBe('inactive')
  expect(storage.getCount()).toBe(4)
})

test('suppressing the hint writes the suppressed count to storage', async ({storage}) => {
  await suppressHint(storage.adapter)

  // `SUPPRESSED_COUNT` is -1, the value that marks the hint as suppressed.
  expect(storage.getCount()).toBe(-1)
})

describe('sessionCountToStatus', () => {
  test('is active while the session count is within the limit', () => {
    expect(sessionCountToStatus(0)).toBe('active')
    expect(sessionCountToStatus(1)).toBe('active')
    expect(sessionCountToStatus(2)).toBe('active')
    expect(sessionCountToStatus(3)).toBe('active')
  })

  test('is inactive once the session count exceeds the limit', () => {
    expect(sessionCountToStatus(4)).toBe('inactive')
    expect(sessionCountToStatus(5)).toBe('inactive')
  })

  test('is inactive when the hint has been suppressed', () => {
    expect(sessionCountToStatus(-1)).toBe('inactive')
  })
})
