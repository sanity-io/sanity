import {describe, expect, it} from 'vitest'

import {STALE_TAGS_EXPIRY_SECONDS} from '../../constants'
import {currentUnixTime} from '../../utils'
import {cleanupVersions, sortAndCleanupVersions} from '../versionUtils'

describe('cleanupVersions()', () => {
  it('keeps all TTL versions and highest per major', () => {
    const now = currentUnixTime()

    const major1VersionsOutsideTTL = [
      {timestamp: now - STALE_TAGS_EXPIRY_SECONDS - 100, version: '1.0.0'},
      {timestamp: now - STALE_TAGS_EXPIRY_SECONDS - 200, version: '1.1.0'},
    ]
    const major1VersionsInTTL = [{timestamp: now - 100, version: '1.2.0'}]

    const major2VersionsOutsideTTL = [
      {timestamp: now - STALE_TAGS_EXPIRY_SECONDS - 100, version: '2.0.0'},
    ]
    const major2VersionsInTTL = [
      {timestamp: now - 150, version: '2.1.0'},
      {timestamp: now - 200, version: '2.2.0'},
    ]

    const existingVersions = [
      ...major1VersionsOutsideTTL,
      ...major1VersionsInTTL,
      ...major2VersionsOutsideTTL,
      ...major2VersionsInTTL,
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

    const versionsInTTL = [
      {timestamp: now - 100, version: '2.0.0'},
      {timestamp: now - 200, version: '2.1.0'},
    ]

    const newVersionOutsideTTL = {
      timestamp: now - STALE_TAGS_EXPIRY_SECONDS - 100,
      version: '2.3.0',
    }
    const result = cleanupVersions(versionsInTTL, newVersionOutsideTTL)

    expect(result).toHaveLength(3)
    expect(new Set(result.map((v) => v.version))).toEqual(new Set(['2.3.0', '2.1.0', '2.0.0']))
  })

  it('keeps highest semver for each major when adding new version to different major', () => {
    const now = currentUnixTime()

    const major1VersionsInTTL = [
      {timestamp: now - 100, version: '1.0.0'},
      {timestamp: now - 200, version: '1.1.0'},
    ]
    const major2VersionsOutsideTTL = [
      {timestamp: now - 300, version: '2.0.0'},
      {timestamp: now - 400, version: '2.1.0'},
    ]

    const existingVersions = [...major1VersionsInTTL, ...major2VersionsOutsideTTL]
    const newVersionInDifferentMajor = {timestamp: now, version: '3.0.0'}
    const result = cleanupVersions(existingVersions, newVersionInDifferentMajor)

    expect(result).toHaveLength(4)
    expect(new Set(result.map((v) => v.version))).toEqual(
      new Set(['3.0.0', '2.1.0', '1.1.0', '1.0.0']),
    )
  })

  it('handles pre-releases in TTL cleanup', () => {
    const now = currentUnixTime()

    const preReleaseVersionsInTTL = [
      {timestamp: now - 100, version: '2.0.0-alpha.1'},
      {timestamp: now - 200, version: '2.0.0-beta.1'},
    ]
    const regularVersionInTTL = {timestamp: now - 300, version: '1.0.0'}

    const existingVersions = [...preReleaseVersionsInTTL, regularVersionInTTL]
    const newStableVersion = {timestamp: now, version: '2.0.0'}
    const result = cleanupVersions(existingVersions, newStableVersion)

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

  it('does not keep lower outside-TTL version when higher within-TTL version exists', () => {
    const now = currentUnixTime()

    const major1HigherVersionInTTL = {timestamp: now - 100, version: '1.3.0'}
    const major1LowerVersionOutsideTTL = {
      timestamp: now - STALE_TAGS_EXPIRY_SECONDS - 100,
      version: '1.2.0',
    }
    const major2OnlyVersionOutsideTTL = {
      timestamp: now - STALE_TAGS_EXPIRY_SECONDS - 200,
      version: '2.1.0',
    }

    const existingVersions = [
      major1HigherVersionInTTL,
      major1LowerVersionOutsideTTL,
      major2OnlyVersionOutsideTTL,
    ]

    const newVersion = {timestamp: now, version: '3.0.0'}
    const result = cleanupVersions(existingVersions, newVersion)

    expect(result).toHaveLength(3)
    expect(new Set(result.map((v) => v.version))).toEqual(new Set(['3.0.0', '1.3.0', '2.1.0']))
  })

  it('keeps highest semver per major even when outside TTL if major also has TTL versions', () => {
    const now = currentUnixTime()

    const major1LowerVersionInTTL = {timestamp: now - 100, version: '1.2.0'}
    const major1HigherVersionOutsideTTL = {
      timestamp: now - STALE_TAGS_EXPIRY_SECONDS - 100,
      version: '1.3.0',
    }

    const major2HighestVersionOutsideTTL = {
      timestamp: now - STALE_TAGS_EXPIRY_SECONDS - 200,
      version: '2.1.0',
    }
    const major2LowerVersionOutsideTTL = {
      timestamp: now - STALE_TAGS_EXPIRY_SECONDS - 300,
      version: '2.0.0',
    }

    const existingVersions = [
      major1LowerVersionInTTL,
      major1HigherVersionOutsideTTL,
      major2HighestVersionOutsideTTL,
      major2LowerVersionOutsideTTL,
    ]

    const newVersion = {timestamp: now, version: '3.0.0'}
    const result = cleanupVersions(existingVersions, newVersion)

    expect(result).toHaveLength(4)
    expect(new Set(result.map((v) => v.version))).toEqual(
      new Set(['3.0.0', '1.3.0', '1.2.0', '2.1.0']),
    )
  })

  it('throws error for invalid semver versions', () => {
    const now = currentUnixTime()

    const invalidSemverVersion = {timestamp: now - 100, version: 'not-semver'}
    const validSemverVersion = {timestamp: now - 200, version: '1.0.0'}
    const existingVersions = [invalidSemverVersion, validSemverVersion]

    const newVersion = {timestamp: now, version: '2.0.0'}

    expect(() => cleanupVersions(existingVersions, newVersion)).toThrow(
      'Invalid semver version: "not-semver"',
    )
  })
})

describe('sortAndCleanupVersions()', () => {
  it('sorts versions by semver in descending order', () => {
    const now = currentUnixTime()

    const major1LowerVersion = {timestamp: now - 300, version: '1.0.0'}
    const major1HigherVersion = {timestamp: now - 200, version: '1.5.0'}
    const major2LowerVersion = {timestamp: now - 250, version: '2.0.0'}
    const major2HigherVersion = {timestamp: now - 100, version: '2.1.0'}

    const versions = [
      major1LowerVersion,
      major2HigherVersion,
      major1HigherVersion,
      major2LowerVersion,
    ]

    const result = sortAndCleanupVersions(versions)

    expect(result.map((v) => v.version)).toEqual(['2.1.0', '2.0.0', '1.5.0', '1.0.0'])
  })

  it('handles pre-release versions correctly in sort order', () => {
    const now = currentUnixTime()

    const alphaPreRelease = {timestamp: now - 100, version: '2.0.0-alpha.1'}
    const betaPreRelease = {timestamp: now - 150, version: '2.0.0-beta.1'}
    const stableRelease = {timestamp: now - 50, version: '2.0.0'}
    const olderMajorVersion = {timestamp: now - 200, version: '1.0.0'}

    const versions = [alphaPreRelease, olderMajorVersion, betaPreRelease, stableRelease]

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

    const invalidSemverVersion = {timestamp: now - 100, version: 'not-semver'}
    const lowerValidVersion = {timestamp: now - 200, version: '1.0.0'}
    const higherValidVersion = {timestamp: now - 50, version: '2.0.0'}

    const versions = [invalidSemverVersion, lowerValidVersion, higherValidVersion]

    const result = sortAndCleanupVersions(versions)

    expect(result.map((v) => v.version)).toEqual(['2.0.0', '1.0.0', 'not-semver'])
  })

  it('deduplicates versions keeping most recent timestamp', () => {
    const now = currentUnixTime()

    const newerDuplicateVersion = {timestamp: now - 100, version: '1.0.0'}
    const olderDuplicateVersion = {timestamp: now - 200, version: '1.0.0'}
    const uniqueVersion = {timestamp: now - 50, version: '2.0.0'}

    const versions = [newerDuplicateVersion, olderDuplicateVersion, uniqueVersion]

    const result = sortAndCleanupVersions(versions)

    expect(result).toHaveLength(2)
    expect(result).toContainEqual(newerDuplicateVersion)
    expect(result).toContainEqual(uniqueVersion)
  })

  it('handles empty version arrays', () => {
    expect(sortAndCleanupVersions([])).toEqual([])
  })
})

describe('cleanupVersions() with cleanup and sorting', () => {
  it('returns correctly cleaned and sorted versions combining TTL and highest per major', () => {
    const now = currentUnixTime()

    const major1VersionsOutsideTTL = [
      {timestamp: now - STALE_TAGS_EXPIRY_SECONDS - 100, version: '1.0.0'},
      {timestamp: now - STALE_TAGS_EXPIRY_SECONDS - 200, version: '1.1.0'},
    ]
    const major1VersionInTTL = {timestamp: now - 100, version: '1.2.0'}

    const major2VersionOutsideTTL = {
      timestamp: now - STALE_TAGS_EXPIRY_SECONDS - 100,
      version: '2.0.0',
    }
    const major2VersionsInTTL = [
      {timestamp: now - 150, version: '2.1.0'},
      {timestamp: now - 200, version: '2.2.0'},
    ]

    const existingVersions = [
      ...major1VersionsOutsideTTL,
      major1VersionInTTL,
      major2VersionOutsideTTL,
      ...major2VersionsInTTL,
    ]

    const newVersion = {timestamp: now, version: '2.3.0'}
    const result = cleanupVersions(existingVersions, newVersion)

    expect(result).toEqual([
      newVersion,
      {timestamp: now - 200, version: '2.2.0'},
      {timestamp: now - 150, version: '2.1.0'},
      major1VersionInTTL,
    ])
  })

  it('keeps highest per major even when all versions are within TTL', () => {
    const now = currentUnixTime()

    const major1VersionsInTTL = [
      {timestamp: now - 100, version: '1.0.0'},
      {timestamp: now - 200, version: '1.1.0'},
    ]
    const major2VersionsOutsideTTL = [
      {timestamp: now - 300, version: '2.0.0'},
      {timestamp: now - 400, version: '2.1.0'},
    ]

    const existingVersions = [...major1VersionsInTTL, ...major2VersionsOutsideTTL]
    const newVersion = {timestamp: now, version: '3.0.0'}
    const result = cleanupVersions(existingVersions, newVersion)

    expect(result).toEqual([
      newVersion,
      {timestamp: now - 400, version: '2.1.0'},
      {timestamp: now - 200, version: '1.1.0'},
      {timestamp: now - 100, version: '1.0.0'},
    ])
  })
})

describe('sortAndCleanupVersions() with deduplication and sorting', () => {
  it('correctly deduplicates and sorts complex version set', () => {
    const now = currentUnixTime()

    const newerDuplicateVersion = {timestamp: now - 100, version: '1.0.0'}
    const olderDuplicateVersion = {timestamp: now - 200, version: '1.0.0'}
    const stableVersion = {timestamp: now - 50, version: '2.0.0'}
    const preReleaseVersion = {timestamp: now - 150, version: '2.0.0-beta.1'}
    const invalidVersion = {timestamp: now - 300, version: 'invalid-version'}

    const versions = [
      newerDuplicateVersion,
      olderDuplicateVersion,
      stableVersion,
      preReleaseVersion,
      invalidVersion,
    ]

    const result = sortAndCleanupVersions(versions)

    expect(result).toEqual([
      stableVersion,
      preReleaseVersion,
      newerDuplicateVersion,
      invalidVersion,
    ])
  })
})
