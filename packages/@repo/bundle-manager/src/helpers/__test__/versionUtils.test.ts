import {describe, expect, it} from 'vitest'

import {STALE_TAGS_EXPIRY_SECONDS} from '../../constants'
import {currentUnixTime} from '../../utils'
import {cleanupVersions, sortAndCleanupVersions} from '../versionUtils'

describe('cleanupVersions()', () => {
  it('should keep all TTL versions and the most recent outside-TTL version per major', () => {
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
    const newestVersion = {timestamp: now, version: '2.3.0'}

    const allVersions = [
      ...major1VersionsOutsideTTL,
      major1VersionInTTL,
      major2VersionOutsideTTL,
      ...major2VersionsInTTL,
      newestVersion,
    ]

    const result = cleanupVersions(allVersions)

    expect(result).toEqual([
      newestVersion,
      major2VersionsInTTL[1],
      major2VersionsInTTL[0],
      major2VersionOutsideTTL,
      major1VersionInTTL,
      major1VersionsOutsideTTL[1],
    ])
  })

  it('should exclude lower outside-TTL version when higher outside TTL version exists for same major', () => {
    const now = currentUnixTime()

    const major1VersionInTTL = {timestamp: now - 100, version: '1.3.0'}
    const major1VersionOutsideTTL = {
      timestamp: now - STALE_TAGS_EXPIRY_SECONDS - 100,
      version: '1.2.0',
    }
    const major1LowerVersionOutsideTTL = {
      timestamp: now - STALE_TAGS_EXPIRY_SECONDS - 200,
      version: '1.1.0',
    }
    const major2OnlyVersionOutsideTTL = {
      timestamp: now - STALE_TAGS_EXPIRY_SECONDS - 200,
      version: '2.1.0',
    }
    const major3NewVersion = {timestamp: now, version: '3.0.0'}

    const allVersions = [
      major1VersionInTTL,
      major1VersionOutsideTTL,
      major1LowerVersionOutsideTTL,
      major2OnlyVersionOutsideTTL,
      major3NewVersion,
    ]

    const result = cleanupVersions(allVersions)
    expect(result).toEqual([
      major3NewVersion,
      major2OnlyVersionOutsideTTL,
      major1VersionInTTL,
      major1VersionOutsideTTL,
    ])
  })

  it('should keep both TTL version and higher outside-TTL version for same major', () => {
    const now = currentUnixTime()

    const major1VersionInTTL = {timestamp: now - 100, version: '1.2.0'}
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
    const major3NewVersion = {timestamp: now, version: '3.0.0'}

    const allVersions = [
      major1VersionInTTL,
      major1HigherVersionOutsideTTL,
      major2HighestVersionOutsideTTL,
      major2LowerVersionOutsideTTL,
      major3NewVersion,
    ]

    const result = cleanupVersions(allVersions)

    expect(result).toEqual([
      major3NewVersion,
      major2HighestVersionOutsideTTL,
      major1HigherVersionOutsideTTL,
      major1VersionInTTL,
    ])
  })

  it('should keep all TTL versions plus highest outside-TTL version when major has multiple of each', () => {
    const now = currentUnixTime()

    const major1FirstVersionInTTL = {timestamp: now - 100, version: '1.1.0'}
    const major1SecondVersionInTTL = {timestamp: now - 150, version: '1.2.0'}
    const major1HighestVersionOutsideTTL = {
      timestamp: now - STALE_TAGS_EXPIRY_SECONDS - 100,
      version: '1.4.0',
    }
    const major1LowerVersionOutsideTTL = {
      timestamp: now - STALE_TAGS_EXPIRY_SECONDS - 200,
      version: '1.3.0',
    }
    const major2VersionInTTL = {timestamp: now - 200, version: '2.0.0'}
    const major2HighestVersionOutsideTTL = {
      timestamp: now - STALE_TAGS_EXPIRY_SECONDS - 300,
      version: '2.1.0',
    }
    const major3NewVersion = {timestamp: now, version: '3.0.0'}

    const allVersions = [
      major1FirstVersionInTTL,
      major1SecondVersionInTTL,
      major1HighestVersionOutsideTTL,
      major1LowerVersionOutsideTTL,
      major2VersionInTTL,
      major2HighestVersionOutsideTTL,
      major3NewVersion,
    ]

    const result = cleanupVersions(allVersions)

    expect(result).toEqual([
      major3NewVersion,
      major2HighestVersionOutsideTTL,
      major2VersionInTTL,
      major1HighestVersionOutsideTTL,
      major1SecondVersionInTTL,
      major1FirstVersionInTTL,
    ])
  })

  it('should keep highest outside-TTL version when it is the only version for that major', () => {
    const now = currentUnixTime()

    const major1FirstVersionInTTL = {timestamp: now - 100, version: '1.0.0'}
    const major1SecondVersionInTTL = {timestamp: now - 200, version: '1.1.0'}
    const major2LowerVersionOutsideTTL = {timestamp: now - 300, version: '2.0.0'}
    const major2HighestVersionOutsideTTL = {timestamp: now - 400, version: '2.1.0'}
    const major3NewVersion = {timestamp: now, version: '3.0.0'}

    const allVersions = [
      major1FirstVersionInTTL,
      major1SecondVersionInTTL,
      major2LowerVersionOutsideTTL,
      major2HighestVersionOutsideTTL,
      major3NewVersion,
    ]

    const result = cleanupVersions(allVersions)

    expect(result).toEqual([
      major3NewVersion,
      major2HighestVersionOutsideTTL,
      major1SecondVersionInTTL,
      major1FirstVersionInTTL,
    ])
  })

  it('should include highest version even when it is outside TTL window', () => {
    const now = currentUnixTime()

    const major2FirstVersionInTTL = {timestamp: now - 100, version: '2.0.0'}
    const major2SecondVersionInTTL = {timestamp: now - 200, version: '2.1.0'}
    const major2HighestVersionOutsideTTL = {
      timestamp: now - STALE_TAGS_EXPIRY_SECONDS - 100,
      version: '2.3.0',
    }

    const allVersions = [
      major2FirstVersionInTTL,
      major2SecondVersionInTTL,
      major2HighestVersionOutsideTTL,
    ]

    const result = cleanupVersions(allVersions)

    expect(result).toEqual([
      major2HighestVersionOutsideTTL,
      major2SecondVersionInTTL,
      major2FirstVersionInTTL,
    ])
  })

  it('should preserve highest versions across different major families', () => {
    const now = currentUnixTime()

    const major1FirstVersionInTTL = {timestamp: now - 100, version: '1.0.0'}
    const major1SecondVersionInTTL = {timestamp: now - 200, version: '1.1.0'}
    const major2LowerVersionOutsideTTL = {
      timestamp: now - STALE_TAGS_EXPIRY_SECONDS - 100,
      version: '2.0.0',
    }
    const major2HighestVersionOutsideTTL = {
      timestamp: now - STALE_TAGS_EXPIRY_SECONDS - 200,
      version: '2.1.0',
    }
    const major3NewVersion = {timestamp: now, version: '3.0.0'}

    const allVersions = [
      major1FirstVersionInTTL,
      major1SecondVersionInTTL,
      major2LowerVersionOutsideTTL,
      major2HighestVersionOutsideTTL,
      major3NewVersion,
    ]

    const result = cleanupVersions(allVersions)

    expect(result).toEqual([
      major3NewVersion,
      major2HighestVersionOutsideTTL,
      major1SecondVersionInTTL,
      major1FirstVersionInTTL,
    ])
  })

  it('should preserve all pre-release and stable versions within TTL regardless of version similarity', () => {
    const now = currentUnixTime()

    const preReleaseAlphaVersionInTTL = {timestamp: now - 100, version: '2.0.0-alpha.1'}
    const preReleaseBetaVersionInTTL = {timestamp: now - 200, version: '2.0.0-beta.1'}
    const major1StableVersionInTTL = {timestamp: now - 300, version: '1.0.0'}
    const major2NewStableVersion = {timestamp: now, version: '2.0.0'}

    const allVersions = [
      preReleaseAlphaVersionInTTL,
      preReleaseBetaVersionInTTL,
      major1StableVersionInTTL,
      major2NewStableVersion,
    ]

    const result = cleanupVersions(allVersions)

    expect(result).toEqual([
      major2NewStableVersion,
      preReleaseBetaVersionInTTL,
      preReleaseAlphaVersionInTTL,
      major1StableVersionInTTL,
    ])
  })

  it('should return empty array when given empty input', () => {
    const result = cleanupVersions([])
    expect(result).toEqual([])
  })

  it('should return single version unchanged when given single version input', () => {
    const now = currentUnixTime()
    const singleVersion = {timestamp: now, version: '1.0.0'}
    const result = cleanupVersions([singleVersion])
    expect(result).toEqual([singleVersion])
  })

  it('should throw error when encountering invalid semver version', () => {
    const now = currentUnixTime()
    const invalidSemverVersion = {timestamp: now - 100, version: 'not-semver'}
    const validSemverVersion = {timestamp: now - 200, version: '1.0.0'}
    const allVersions = [invalidSemverVersion, validSemverVersion]

    expect(() => cleanupVersions(allVersions)).toThrow('Invalid semver version: "not-semver"')
  })

  it('should deduplicate duplicate versions within TTL and keep entry with most recent timestamp', () => {
    const now = currentUnixTime()

    const major1VersionInTTL = {timestamp: now - 100, version: '1.0.0'}
    const major1SameVersionOlderTimestamp = {timestamp: now - 200, version: '1.0.0'}
    const major2VersionInTTL = {timestamp: now - 150, version: '2.0.0'}
    const major2SameVersionNewerTimestamp = {timestamp: now - 50, version: '2.0.0'}

    const allVersions = [
      major1VersionInTTL,
      major1SameVersionOlderTimestamp,
      major2VersionInTTL,
      major2SameVersionNewerTimestamp,
    ]

    const result = cleanupVersions(allVersions)

    expect(result).toEqual([major2SameVersionNewerTimestamp, major1VersionInTTL])
  })

  it('should deduplicate versions across TTL boundary and keep entry with most recent timestamp', () => {
    const now = currentUnixTime()

    const major1VersionOutsideTTL = {
      timestamp: now - STALE_TAGS_EXPIRY_SECONDS - 100,
      version: '1.0.0',
    }
    const major1SameVersionInTTL = {timestamp: now - 100, version: '1.0.0'}
    const major2VersionInTTL = {timestamp: now - 150, version: '2.0.0'}
    const major2SameVersionOutsideTTL = {
      timestamp: now - STALE_TAGS_EXPIRY_SECONDS - 200,
      version: '2.0.0',
    }

    const allVersions = [
      major1VersionOutsideTTL,
      major1SameVersionInTTL,
      major2VersionInTTL,
      major2SameVersionOutsideTTL,
    ]

    const result = cleanupVersions(allVersions)

    expect(result).toEqual([major2VersionInTTL, major1SameVersionInTTL])
  })
})

describe('sortAndCleanupVersions()', () => {
  it('should sort valid semver versions in descending order', () => {
    const now = currentUnixTime()

    const major1LowerVersion = {timestamp: now - 300, version: '1.0.0'}
    const major2HigherVersion = {timestamp: now - 100, version: '2.1.0'}
    const major1HigherVersion = {timestamp: now - 200, version: '1.5.0'}
    const major2LowerVersion = {timestamp: now - 250, version: '2.0.0'}

    const versions = [
      major1LowerVersion,
      major2HigherVersion,
      major1HigherVersion,
      major2LowerVersion,
    ]

    const result = sortAndCleanupVersions(versions)
    expect(result).toEqual([
      major2HigherVersion,
      major2LowerVersion,
      major1HigherVersion,
      major1LowerVersion,
    ])
  })

  it('should sort pre-release versions correctly relative to stable versions', () => {
    const now = currentUnixTime()

    const preReleaseAlphaVersion = {timestamp: now - 100, version: '2.0.0-alpha.1'}
    const major1StableVersion = {timestamp: now - 200, version: '1.0.0'}
    const preReleaseBetaVersion = {timestamp: now - 150, version: '2.0.0-beta.1'}
    const major2StableVersion = {timestamp: now - 50, version: '2.0.0'}

    const versions = [
      preReleaseAlphaVersion,
      major1StableVersion,
      preReleaseBetaVersion,
      major2StableVersion,
    ]

    const result = sortAndCleanupVersions(versions)
    expect(result).toEqual([
      major2StableVersion,
      preReleaseBetaVersion,
      preReleaseAlphaVersion,
      major1StableVersion,
    ])
  })

  it('should place invalid semver versions after all valid versions', () => {
    const now = currentUnixTime()

    const invalidSemverVersion = {timestamp: now - 100, version: 'not-semver'}
    const lowerValidVersion = {timestamp: now - 200, version: '1.0.0'}
    const higherValidVersion = {timestamp: now - 50, version: '2.0.0'}

    const versions = [invalidSemverVersion, lowerValidVersion, higherValidVersion]

    const result = sortAndCleanupVersions(versions)
    expect(result).toEqual([higherValidVersion, lowerValidVersion, invalidSemverVersion])
  })

  it('should deduplicate versions and keep entry with most recent timestamp', () => {
    const now = currentUnixTime()

    const newerDuplicateVersion = {timestamp: now - 100, version: '1.0.0'}
    const olderDuplicateVersion = {timestamp: now - 200, version: '1.0.0'}
    const uniqueVersion = {timestamp: now - 50, version: '2.0.0'}

    const versions = [newerDuplicateVersion, olderDuplicateVersion, uniqueVersion]
    const result = sortAndCleanupVersions(versions)

    expect(result).toEqual([uniqueVersion, newerDuplicateVersion])
  })

  it('should return empty array when given empty input', () => {
    expect(sortAndCleanupVersions([])).toEqual([])
  })
})
