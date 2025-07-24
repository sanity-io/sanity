import {describe, expect, it} from 'vitest'

import {STALE_TAGS_EXPIRY_SECONDS} from '../../constants'
import {currentUnixTime} from '../../utils'
import {cleanupVersions, sortAndCleanupVersions} from '../versionUtils'

describe('cleanupVersions()', () => {
  it('applies TTL cleanup for new version major while keeping highest for other majors', () => {
    const now = currentUnixTime()
    const existingVersions = [
      // Major version 1 - old versions
      {timestamp: now - STALE_TAGS_EXPIRY_SECONDS - 100, version: '1.0.0'}, // Outside TTL
      {timestamp: now - STALE_TAGS_EXPIRY_SECONDS - 200, version: '1.1.0'}, // Outside TTL
      {timestamp: now - 100, version: '1.2.0'}, // Within TTL
      // Major version 2 - mixed ages
      {timestamp: now - STALE_TAGS_EXPIRY_SECONDS - 100, version: '2.0.0'}, // Outside TTL
      {timestamp: now - 150, version: '2.1.0'}, // Within TTL
      {timestamp: now - 200, version: '2.2.0'}, // Within TTL
    ]

    const newVersion = {timestamp: now, version: '2.3.0'}
    const result = cleanupVersions(existingVersions, newVersion)

    expect(result).toHaveLength(4)
    expect(new Set(result.map((v) => v.version))).toEqual(
      new Set(['2.3.0', '2.2.0', '2.1.0', '1.2.0']),
    )
  })

  it('always includes new version even if outside TTL', () => {
    const now = currentUnixTime()
    const existingVersions = [
      {timestamp: now - 100, version: '2.0.0'},
      {timestamp: now - 200, version: '2.1.0'},
    ]

    const newVersion = {timestamp: now - STALE_TAGS_EXPIRY_SECONDS - 100, version: '2.3.0'}
    const result = cleanupVersions(existingVersions, newVersion)

    expect(result).toHaveLength(3)
    expect(new Set(result.map((v) => v.version))).toEqual(new Set(['2.3.0', '2.1.0', '2.0.0']))
  })

  it('keeps highest semver for different major when adding new version', () => {
    const now = currentUnixTime()
    const existingVersions = [
      {timestamp: now - 100, version: '1.0.0'},
      {timestamp: now - 200, version: '1.1.0'},
      {timestamp: now - 300, version: '2.0.0'},
      {timestamp: now - 400, version: '2.1.0'},
    ]

    const newVersion = {timestamp: now, version: '3.0.0'}
    const result = cleanupVersions(existingVersions, newVersion)

    expect(result).toHaveLength(3)
    expect(new Set(result.map((v) => v.version))).toEqual(new Set(['3.0.0', '2.1.0', '1.1.0']))
  })

  it('handles pre-releases in TTL cleanup', () => {
    const now = currentUnixTime()
    const existingVersions = [
      {timestamp: now - 100, version: '2.0.0-alpha.1'},
      {timestamp: now - 200, version: '2.0.0-beta.1'},
      {timestamp: now - 300, version: '1.0.0'},
    ]

    const newVersion = {timestamp: now, version: '2.0.0'}
    const result = cleanupVersions(existingVersions, newVersion)

    expect(result).toHaveLength(4)
    expect(new Set(result.map((v) => v.version))).toEqual(
      new Set(['2.0.0', '2.0.0-beta.1', '2.0.0-alpha.1', '1.0.0']),
    )
  })

  it('handles empty existing versions array', () => {
    const now = currentUnixTime()
    const newVersion = {timestamp: now, version: '1.0.0'}
    const result = cleanupVersions([], newVersion)

    expect(result).toEqual([newVersion])
  })

  it('throws error for invalid semver versions', () => {
    const now = currentUnixTime()
    const existingVersions = [
      {timestamp: now - 100, version: 'not-semver'},
      {timestamp: now - 200, version: '1.0.0'},
    ]

    const newVersion = {timestamp: now, version: '2.0.0'}

    expect(() => cleanupVersions(existingVersions, newVersion)).toThrow(
      'Invalid semver version: "not-semver"',
    )
  })
})

describe('sortAndCleanupVersions()', () => {
  it('sorts versions by semver in descending order', () => {
    const now = currentUnixTime()
    const versions = [
      {timestamp: now - 300, version: '1.0.0'},
      {timestamp: now - 100, version: '2.1.0'},
      {timestamp: now - 200, version: '1.5.0'},
      {timestamp: now - 250, version: '2.0.0'},
    ]

    const result = sortAndCleanupVersions(versions)

    expect(result.map((v) => v.version)).toEqual(['2.1.0', '2.0.0', '1.5.0', '1.0.0'])
  })

  it('handles pre-release versions correctly in sort order', () => {
    const now = currentUnixTime()
    const versions = [
      {timestamp: now - 100, version: '2.0.0-alpha.1'},
      {timestamp: now - 200, version: '1.0.0'},
      {timestamp: now - 150, version: '2.0.0-beta.1'},
      {timestamp: now - 50, version: '2.0.0'},
    ]

    const result = sortAndCleanupVersions(versions)

    expect(result.map((v) => v.version)).toEqual([
      '2.0.0',
      '2.0.0-beta.1',
      '2.0.0-alpha.1',
      '1.0.0',
    ])
  })

  it('sorts invalid semver versions after valid ones', () => {
    const now = currentUnixTime()
    const versions = [
      {timestamp: now - 100, version: 'not-semver'},
      {timestamp: now - 200, version: '1.0.0'},
      {timestamp: now - 50, version: '2.0.0'},
    ]

    const result = sortAndCleanupVersions(versions)

    expect(result.map((v) => v.version)).toEqual(['2.0.0', '1.0.0', 'not-semver'])
  })

  it('deduplicates versions keeping most recent timestamp', () => {
    const now = currentUnixTime()
    const versions = [
      {timestamp: now - 100, version: '1.0.0'},
      {timestamp: now - 200, version: '1.0.0'}, // Older duplicate
      {timestamp: now - 50, version: '2.0.0'},
    ]

    const result = sortAndCleanupVersions(versions)

    expect(result).toHaveLength(2)
    expect(result).toContainEqual({timestamp: now - 100, version: '1.0.0'}) // Newer timestamp kept
    expect(result).toContainEqual({timestamp: now - 50, version: '2.0.0'})
  })

  it('handles empty version arrays', () => {
    expect(sortAndCleanupVersions([])).toEqual([])
  })
})

describe('cleanupVersions() with cleanup and sorting', () => {
  it('returns correctly cleaned and sorted versions for TTL scenario', () => {
    const now = currentUnixTime()
    const existingVersions = [
      // Major version 1 - old versions
      {timestamp: now - STALE_TAGS_EXPIRY_SECONDS - 100, version: '1.0.0'}, // Outside TTL
      {timestamp: now - STALE_TAGS_EXPIRY_SECONDS - 200, version: '1.1.0'}, // Outside TTL
      {timestamp: now - 100, version: '1.2.0'}, // Within TTL
      // Major version 2 - mixed ages
      {timestamp: now - STALE_TAGS_EXPIRY_SECONDS - 100, version: '2.0.0'}, // Outside TTL
      {timestamp: now - 150, version: '2.1.0'}, // Within TTL
      {timestamp: now - 200, version: '2.2.0'}, // Within TTL
    ]

    const newVersion = {timestamp: now, version: '2.3.0'}
    const result = cleanupVersions(existingVersions, newVersion)

    expect(result).toEqual([
      newVersion, // 2.3.0 - new version (highest)
      {timestamp: now - 200, version: '2.2.0'}, // 2.2.0 - within TTL in major 2
      {timestamp: now - 150, version: '2.1.0'}, // 2.1.0 - within TTL in major 2
      {timestamp: now - 100, version: '1.2.0'}, // 1.2.0 - highest in major 1
    ])
  })

  it('returns correctly cleaned and sorted versions when adding to different major', () => {
    const now = currentUnixTime()
    const existingVersions = [
      {timestamp: now - 100, version: '1.0.0'},
      {timestamp: now - 200, version: '1.1.0'},
      {timestamp: now - 300, version: '2.0.0'},
      {timestamp: now - 400, version: '2.1.0'},
    ]

    const newVersion = {timestamp: now, version: '3.0.0'}
    const result = cleanupVersions(existingVersions, newVersion)

    expect(result).toEqual([
      newVersion, // 3.0.0 - new version (highest)
      {timestamp: now - 400, version: '2.1.0'}, // Highest in major 2
      {timestamp: now - 200, version: '1.1.0'}, // Highest in major 1
    ])
  })
})

describe('sortAndCleanupVersions() with deduplication and sorting', () => {
  it('correctly deduplicates and sorts complex version set', () => {
    const now = currentUnixTime()
    const versions = [
      {timestamp: now - 100, version: '1.0.0'},
      {timestamp: now - 200, version: '1.0.0'}, // Duplicate with older timestamp
      {timestamp: now - 50, version: '2.0.0'},
      {timestamp: now - 150, version: '2.0.0-beta.1'},
      {timestamp: now - 300, version: 'invalid-version'},
    ]

    const result = sortAndCleanupVersions(versions)

    expect(result).toEqual([
      {timestamp: now - 50, version: '2.0.0'},
      {timestamp: now - 150, version: '2.0.0-beta.1'},
      {timestamp: now - 100, version: '1.0.0'}, // Most recent timestamp kept
      {timestamp: now - 300, version: 'invalid-version'}, // Invalid versions last
    ])
  })
})
