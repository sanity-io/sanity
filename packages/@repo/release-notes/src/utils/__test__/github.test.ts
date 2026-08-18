import {describe, expect, it} from 'vitest'

import {getPrNumberFromSubject} from '../github'

describe('getPrNumberFromSubject', () => {
  it('returns the trailing PR number added by squash merge', () => {
    expect(getPrNumberFromSubject('fix: bump @sanity/cli to ^7.1.0 (#13020)')).toBe(13020)
  })

  it('returns the last PR number for backported commits', () => {
    expect(
      getPrNumberFromSubject('fix(sanity): set touch-action on drag handle (#12931) (#12932)'),
    ).toBe(12932)
  })

  it('returns undefined when the subject has no trailing PR number', () => {
    expect(
      getPrNumberFromSubject('feat(studio): remove deprecated `enableLegacySearch` option'),
    ).toBeUndefined()
  })

  it('ignores PR numbers that are not at the end of the subject', () => {
    expect(getPrNumberFromSubject('fix: revert (#123) related change')).toBeUndefined()
  })

  it('returns undefined for undefined subject', () => {
    expect(getPrNumberFromSubject(undefined)).toBeUndefined()
  })
})
