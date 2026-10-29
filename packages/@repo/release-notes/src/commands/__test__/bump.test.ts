import {describe, expect, it} from 'vitest'

import {type PnpmPackage, computeVersion, selectPackagesToBump} from '../bump'

function pkg(name: string, version: string, isPrivate = false): PnpmPackage {
  return {name, version, path: `/repo/packages/${name}`, private: isPrivate}
}

describe('selectPackagesToBump', () => {
  it('includes a publishable package that has drifted from the root version', () => {
    const selected = selectPackagesToBump([
      pkg('sanity', '6.9.2'),
      pkg('@sanity/access-ui', '6.9.1'),
    ])

    expect(selected.map((p) => p.name)).toStrictEqual(['sanity', '@sanity/access-ui'])
  })

  it('excludes private packages regardless of their version', () => {
    const selected = selectPackagesToBump([
      pkg('sanity', '6.9.2'),
      pkg('sanity-root', '6.9.2', true),
      pkg('sanity-test-studio', '6.9.2', true),
      pkg('scripts', '4.11.0', true),
    ])

    expect(selected.map((p) => p.name)).toStrictEqual(['sanity'])
  })
})

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

  it('bumps a major prerelease', () => {
    expect(
      computeVersion({
        currentVersion: '5.18.0',
        semverIncrement: 'major',
        preid: 'next-major',
        suffix: '20260326120000+abc1234',
      }),
    ).toBe('6.0.0-next-major.20260326120000+abc1234')
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
