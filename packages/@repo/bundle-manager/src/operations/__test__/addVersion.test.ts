import {describe, expect, it} from 'vitest'

import {STALE_TAGS_EXPIRY_SECONDS} from '../../constants'
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

  it('applies TTL cleanup for new version major, keeps highest for other majors', () => {
    const now = currentUnixTime()

    const versions = [
      // Major version 1 - should keep only highest
      {timestamp: now - 100, version: '1.0.0'},
      {timestamp: now - 200, version: '1.1.0'},
      {timestamp: now - 250, version: '1.2.0'},
      // Major version 2 - will get TTL treatment when we add 2.3.0
      {timestamp: now - STALE_TAGS_EXPIRY_SECONDS - 100, version: '2.0.0'}, // Outside TTL
      {timestamp: now - 150, version: '2.1.0'}, // Within TTL
      {timestamp: now - 200, version: '2.2.0'}, // Within TTL
    ]

    const newVersion = {timestamp: now, version: '2.3.0'}
    const result = addVersion({versions}, newVersion)

    expect(result.versions).toHaveLength(4) // newVersion + 2 TTL versions from major 2 + highest from major 1
    expect(result.versions).toEqual([
      newVersion, // 2.3.0 - new version
      {timestamp: now - 200, version: '2.2.0'}, // 2.2.0 - within TTL in major 2
      {timestamp: now - 150, version: '2.1.0'}, // 2.1.0 - within TTL in major 2
      {timestamp: now - 250, version: '1.2.0'}, // 1.2.0 - highest in major 1
    ])
  })

  it('always includes new version even if outside TTL', () => {
    const now = currentUnixTime()

    const versions = [
      {timestamp: now - 100, version: '2.0.0'}, // Within TTL
      {timestamp: now - 200, version: '2.1.0'}, // Within TTL
    ]

    // Adding old version that would be outside TTL
    const newVersion = {timestamp: now - STALE_TAGS_EXPIRY_SECONDS - 100, version: '2.3.0'}
    const result = addVersion({versions}, newVersion)

    expect(result.versions).toHaveLength(3)
    expect(result.versions.map((v) => v.version)).toEqual(['2.3.0', '2.1.0', '2.0.0'])
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

    // With TTL cleanup for major 1 (new version's major), we keep both 1.5.0 and 1.2.0
    // For other majors, we keep highest: 2.0.0 and 0.9.0
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

    // Should keep all pre-releases in major 2 (TTL cleanup) plus highest in major 1
    expect(result.versions).toHaveLength(4)
    expect(result.versions.map((v) => v.version)).toEqual([
      '2.0.0',
      '2.0.0-beta.1',
      '2.0.0-alpha.1',
      '1.0.0',
    ])
  })
})
