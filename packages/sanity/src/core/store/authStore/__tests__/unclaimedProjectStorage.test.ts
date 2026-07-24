import {beforeEach, describe, expect, it, vi} from 'vitest'

import {getUnclaimedProjectStorageKey} from '../constants'
import {
  clearUnclaimedProjectRecord,
  clearUnclaimedProjectSnooze,
  readUnclaimedProjectRecord,
  readUnclaimedProjectSnoozedAt,
  recordHashClaimUrl,
  writeUnclaimedProjectRecord,
  writeUnclaimedProjectSnoozedAt,
} from '../unclaimedProjectStorage'

// In jsdom/Node.js supportsLocalStorage is false because process.versions.node is defined.
vi.mock('../../../util/supportsLocalStorage', () => ({
  supportsLocalStorage: true,
}))

const PROJECT_ID = 'test-project'
const CLAIM_URL = 'https://www.sanity.io/manage/claim/some-claim-token'
const STORAGE_KEY = getUnclaimedProjectStorageKey(PROJECT_ID)

describe('unclaimedProjectStorage', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('round-trips a record', () => {
    const record = {claimUrl: CLAIM_URL, expiresAt: '2026-07-27T00:00:00.000Z'}
    writeUnclaimedProjectRecord(PROJECT_ID, record)
    expect(readUnclaimedProjectRecord(PROJECT_ID)).toEqual(record)
    clearUnclaimedProjectRecord(PROJECT_ID)
    expect(readUnclaimedProjectRecord(PROJECT_ID)).toBeUndefined()
  })

  it('reads a missing record as undefined', () => {
    expect(readUnclaimedProjectRecord(PROJECT_ID)).toBeUndefined()
  })

  it.each([
    ['invalid JSON', 'not-json'],
    ['wrong shape', JSON.stringify({expiresAt: '2026-07-27T00:00:00.000Z'})],
    ['non-object', JSON.stringify('claim-url')],
    ['non-allowlisted claim URL', JSON.stringify({claimUrl: 'javascript:alert(1)'})],
    ['non-Sanity host', JSON.stringify({claimUrl: 'https://evil.example.com/manage/claim/x'})],
  ])('reads a corrupt record (%s) as absent', (_label, raw) => {
    localStorage.setItem(STORAGE_KEY, raw)
    expect(readUnclaimedProjectRecord(PROJECT_ID)).toBeUndefined()
  })

  it('scopes records by project', () => {
    writeUnclaimedProjectRecord(PROJECT_ID, {claimUrl: CLAIM_URL})
    expect(readUnclaimedProjectRecord('other-project')).toBeUndefined()
  })

  describe('recordHashClaimUrl', () => {
    it('creates a record holding only the claim URL', () => {
      recordHashClaimUrl(PROJECT_ID, CLAIM_URL)
      expect(readUnclaimedProjectRecord(PROJECT_ID)).toEqual({claimUrl: CLAIM_URL})
    })

    it('keeps refinements when the claim URL is unchanged', () => {
      const refined = {
        claimUrl: CLAIM_URL,
        expiresAt: '2026-07-27T00:00:00.000Z',
        lastLookupAt: '2026-07-24T12:00:00.000Z',
      }
      writeUnclaimedProjectRecord(PROJECT_ID, refined)
      recordHashClaimUrl(PROJECT_ID, CLAIM_URL)
      expect(readUnclaimedProjectRecord(PROJECT_ID)).toEqual(refined)
    })

    it('replaces the record when a different claim URL arrives', () => {
      writeUnclaimedProjectRecord(PROJECT_ID, {
        claimUrl: CLAIM_URL,
        expiresAt: '2026-07-27T00:00:00.000Z',
      })
      const nextClaimUrl = 'https://www.sanity.io/manage/claim/another-claim-token'
      recordHashClaimUrl(PROJECT_ID, nextClaimUrl)
      expect(readUnclaimedProjectRecord(PROJECT_ID)).toEqual({claimUrl: nextClaimUrl})
    })
  })

  describe('snooze', () => {
    it('round-trips independently of the record', () => {
      writeUnclaimedProjectSnoozedAt(PROJECT_ID, '2026-07-24T12:00:00.000Z')
      expect(readUnclaimedProjectSnoozedAt(PROJECT_ID)).toBe('2026-07-24T12:00:00.000Z')
      expect(readUnclaimedProjectRecord(PROJECT_ID)).toBeUndefined()
      clearUnclaimedProjectSnooze(PROJECT_ID)
      expect(readUnclaimedProjectSnoozedAt(PROJECT_ID)).toBeUndefined()
    })
  })
})
