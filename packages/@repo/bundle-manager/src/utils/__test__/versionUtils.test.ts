import {describe, expect, it} from 'vitest'

import {STALE_TAGS_EXPIRY_SECONDS} from '../../constants'
import {currentUnixTime} from '../../utils'
import {cleanupVersions, sortAndCleanupVersions} from '../versionUtils'

describe('cleanupVersions()', () => {
  it('applies cleanup logic when no new version specified', () => {
    const now = currentUnixTime()
    const versions = [
      {timestamp: now - 100, version: '1.0.0'},
      {timestamp: now - 200, version: '1.1.0'},
      {timestamp: now - 300, version: '2.0.0'},
    ]

    const result = cleanupVersions(versions)
    expect(result).toHaveLength(2) // One per major (highest semver)
    expect(result.map((v) => v.version)).toEqual(['2.0.0', '1.1.0'])
  })

  it('applies TTL cleanup for new version major, keeps highest for other majors', () => {
    const now = currentUnixTime()

    const versions = [
      // Major version 1 - old versions
      {timestamp: now - STALE_TAGS_EXPIRY_SECONDS - 100, version: '1.0.0'}, // Outside TTL
      {timestamp: now - STALE_TAGS_EXPIRY_SECONDS - 200, version: '1.1.0'}, // Outside TTL
      {timestamp: now - 100, version: '1.2.0'}, // Within TTL
      // Major version 2 - mixed ages
      {timestamp: now - STALE_TAGS_EXPIRY_SECONDS - 100, version: '2.0.0'}, // Outside TTL
      {timestamp: now - 150, version: '2.1.0'}, // Within TTL
      {timestamp: now - 200, version: '2.2.0'}, // Within TTL
    ]

    // Adding new version to major 2
    const newVersion = {timestamp: now, version: '2.3.0'}
    const result = cleanupVersions(versions, newVersion)

    expect(result).toHaveLength(4) // newVersion + 2 TTL versions from major 2 + highest from major 1
    expect(result).toEqual([
      newVersion, // 2.3.0 - new version
      {timestamp: now - 200, version: '2.2.0'}, // 2.2.0 - within TTL in major 2
      {timestamp: now - 150, version: '2.1.0'}, // 2.1.0 - within TTL in major 2
      {timestamp: now - 100, version: '1.2.0'}, // 1.2.0 - highest in major 1
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
    const result = cleanupVersions(versions, newVersion)

    expect(result).toHaveLength(3)
    expect(result.map((v) => v.version)).toEqual(['2.3.0', '2.1.0', '2.0.0'])
  })

  it('falls back to highest semver per major when no new version specified', () => {
    const now = currentUnixTime()
    const versions = [
      {timestamp: now - 100, version: '1.0.0'},
      {timestamp: now - 200, version: '1.1.0'},
      {timestamp: now - 300, version: '2.0.0'},
      {timestamp: now - 400, version: '2.1.0'},
    ]

    const result = cleanupVersions(versions)
    expect(result).toHaveLength(2)
    expect(result).toEqual([
      {timestamp: now - 400, version: '2.1.0'}, // Highest in major 2
      {timestamp: now - 200, version: '1.1.0'}, // Highest in major 1
    ])
  })

  it('handles empty version arrays', () => {
    expect(cleanupVersions([])).toEqual([])
  })

  it('handles invalid semver versions gracefully', () => {
    const now = currentUnixTime()
    const versions = [
      {timestamp: now - 100, version: 'not-semver'},
      {timestamp: now - 200, version: '1.0.0'},
    ]

    const result = cleanupVersions(versions)
    expect(result).toHaveLength(2)
    // Valid semver versions sort before invalid ones
    expect(result.map((v) => v.version)).toEqual(['1.0.0', 'not-semver'])
  })

  it('handles pre-releases in TTL cleanup', () => {
    const now = currentUnixTime()
    const versions = [
      {timestamp: now - 100, version: '2.0.0-alpha.1'},
      {timestamp: now - 200, version: '2.0.0-beta.1'},
      {timestamp: now - 300, version: '1.0.0'},
    ]

    const newVersion = {timestamp: now, version: '2.0.0'}
    const result = cleanupVersions(versions, newVersion)

    expect(result).toHaveLength(4) // New version + 2 pre-releases in TTL + highest from major 1
    expect(result.map((v) => v.version)).toEqual([
      '2.0.0',
      '2.0.0-beta.1',
      '2.0.0-alpha.1',
      '1.0.0',
    ])
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
    expect(result).toHaveLength(4)
    expect(result.map((v) => v.version)).toEqual(['2.1.0', '2.0.0', '1.5.0', '1.0.0'])
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
    expect(result).toEqual([
      {timestamp: now - 50, version: '2.0.0'},
      {timestamp: now - 100, version: '1.0.0'}, // Keeps newer timestamp
    ])
  })

  it('handles pre-release versions correctly', () => {
    const now = currentUnixTime()
    const versions = [
      {timestamp: now - 100, version: '2.0.0-alpha.1'},
      {timestamp: now - 200, version: '1.0.0'},
      {timestamp: now - 150, version: '2.0.0-beta.1'},
      {timestamp: now - 50, version: '2.0.0'},
    ]

    const result = sortAndCleanupVersions(versions)
    expect(result).toHaveLength(4)
    expect(result.map((v) => v.version)).toEqual([
      '2.0.0',
      '2.0.0-beta.1',
      '2.0.0-alpha.1',
      '1.0.0',
    ])
  })

  it('handles invalid semver versions gracefully', () => {
    const now = currentUnixTime()
    const versions = [
      {timestamp: now - 100, version: 'not-semver'},
      {timestamp: now - 200, version: '1.0.0'},
      {timestamp: now - 50, version: '2.0.0'},
    ]

    const result = sortAndCleanupVersions(versions)
    expect(result).toHaveLength(3)
    // Valid semver versions sort before invalid ones
    expect(result.map((v) => v.version)).toEqual(['2.0.0', '1.0.0', 'not-semver'])
  })

  it('handles empty version arrays', () => {
    expect(sortAndCleanupVersions([])).toEqual([])
  })
})
