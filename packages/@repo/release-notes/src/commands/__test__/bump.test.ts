import {describe, expect, it} from 'vitest'

import {computeVersion} from '../bump'

describe('computeVersion', () => {
  it('bumps a stable patch version', () => {
    expect(
      computeVersion({
        currentVersion: '5.18.0',
        semverIncrement: 'patch',
        preid: undefined,
        suffix: undefined,
      }),
    ).toBe('5.18.1')
  })

  it('bumps a stable minor version', () => {
    expect(
      computeVersion({
        currentVersion: '5.18.0',
        semverIncrement: 'minor',
        preid: undefined,
        suffix: undefined,
      }),
    ).toBe('5.19.0')
  })

  it('bumps a stable major version', () => {
    expect(
      computeVersion({
        currentVersion: '5.18.0',
        semverIncrement: 'major',
        preid: undefined,
        suffix: undefined,
      }),
    ).toBe('6.0.0')
  })

  it('produces a prerelease version with preid and suffix', () => {
    expect(
      computeVersion({
        currentVersion: '5.18.0',
        semverIncrement: 'minor',
        preid: 'next',
        suffix: '20260326120000+abc1234',
      }),
    ).toBe('5.19.0-next.20260326120000+abc1234')
  })

  it('produces a prerelease version with commits-ahead suffix', () => {
    expect(
      computeVersion({
        currentVersion: '5.18.0',
        semverIncrement: 'patch',
        preid: 'canary',
        suffix: '42+def5678',
      }),
    ).toBe('5.18.1-canary.42+def5678')
  })

  it('bumps from an existing prerelease version', () => {
    expect(
      computeVersion({
        currentVersion: '5.19.0-next.1',
        semverIncrement: 'minor',
        preid: undefined,
        suffix: undefined,
      }),
    ).toBe('5.19.0')
  })
})
