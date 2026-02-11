import {describe, expect, it} from 'vitest'

import {currentUnixTime} from '../../utils'
import {addVersion} from '../addVersion'

describe('addVersion()', () => {
  it('adds a new version to the version array', () => {
    const version = {timestamp: currentUnixTime(), version: '1.2.3'}
    expect(addVersion({versions: []}, version)).toEqual({
      versions: [version],
    })
  })

  it('replaces any existing version in case it already exists', () => {
    const now = currentUnixTime()
    const newVersion = {timestamp: now, version: '1.2.3'}
    const existingVersion = {timestamp: now - 1000, version: '1.2.3'}
    expect(addVersion({versions: [existingVersion]}, newVersion)).toEqual({
      versions: [newVersion],
    })
  })

  it('sorts versions by semver in descending order', () => {
    const now = currentUnixTime()
    const versions = [
      {timestamp: now - 100, version: '1.2.0'},
      {timestamp: now - 200, version: '2.0.0'},
      {timestamp: now - 250, version: '0.9.0'},
    ]

    const newVersion = {timestamp: now, version: '1.5.0'}
    const result = addVersion({versions}, newVersion)

    expect(result.versions.map((v) => v.version)).toEqual(['2.0.0', '1.5.0', '1.2.0', '0.9.0'])
  })

  it('handles pre-release versions correctly', () => {
    const now = currentUnixTime()
    const versions = [
      {timestamp: now - 100, version: '2.0.0-beta.1'},
      {timestamp: now - 200, version: '2.0.0-alpha.1'},
      {timestamp: now - 250, version: '1.0.0'},
    ]

    const newVersion = {timestamp: now, version: '2.0.0'}
    const result = addVersion({versions}, newVersion)

    expect(result.versions).toHaveLength(4)
    expect(result.versions.map((v) => v.version)).toEqual([
      '2.0.0',
      '2.0.0-beta.1',
      '2.0.0-alpha.1',
      '1.0.0',
    ])
  })
})
