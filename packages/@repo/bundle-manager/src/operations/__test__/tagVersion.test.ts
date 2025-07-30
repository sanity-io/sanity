import {describe, expect, it} from 'vitest'

import {currentUnixTime} from '../../utils'
import {tagVersion} from '../tagVersion'

describe('tagVersion()', () => {
  it('sets a given tag to the given version', () => {
    const existingVersion = {timestamp: currentUnixTime() - 100, version: '1.2.3'}
    const tagEntry = {timestamp: currentUnixTime(), version: '1.2.3' as const}

    expect(tagVersion({versions: [existingVersion]}, 'stable', tagEntry)).toEqual({
      tags: {
        stable: [tagEntry],
      },
      versions: [existingVersion],
    })
  })

  it('throws if version is not already in the version array', () => {
    expect(() =>
      tagVersion({versions: [{timestamp: 1749664258097, version: '1.2.3'}]}, 'stable', {
        timestamp: currentUnixTime(),
        version: '1.2.4',
      }),
    ).toThrowErrorMatchingInlineSnapshot(`[Error: Version "1.2.4" not known]`)
  })

  it('throws if tag is not valid', () => {
    expect(() =>
      // @ts-expect-error - testing error
      tagVersion({versions: [{timestamp: 1749664258097, version: '1.2.3'}]}, 'florp', {
        version: '1.2.3',
        timestamp: currentUnixTime(),
      }),
    ).toThrowErrorMatchingInlineSnapshot(
      `[Error: Invalid tag "florp". Must be one of: latest, stable, next"]`,
    )
  })

  it('keeps existing version tag if exists', () => {
    const versions = [{timestamp: currentUnixTime() - 100, version: '1.2.3'}]

    const existingEntry = {timestamp: currentUnixTime() - 200, version: '1.2.3' as const}
    const newEntry = {timestamp: currentUnixTime(), version: '1.2.3' as const}

    const manifest = {
      tags: {stable: [existingEntry]},
      versions,
    }
    expect(tagVersion(manifest, 'stable', newEntry)).toEqual({
      tags: {
        stable: [existingEntry],
      },
      versions,
    })
  })

  it('removes stale entries when tagging', () => {
    const newEntry = {timestamp: currentUnixTime(), version: '1.2.4' as const}

    const versions = [
      {timestamp: currentUnixTime() - 100, version: '1.2.4'},
      {timestamp: currentUnixTime() - 100, version: '1.2.3'},
    ]

    const manifest = {
      tags: {
        stable: [
          // stale, can and should be removed
          {timestamp: currentUnixTime() - 60 * 31, version: '1.2.3' as const},
        ],
      },
      versions,
    }
    expect(tagVersion(manifest, 'stable', newEntry)).toEqual({
      tags: {
        stable: [newEntry],
      },
      versions,
    })
  })

  it('sets default when passed options.setAsDefault is true', () => {
    const newEntry = {timestamp: currentUnixTime(), version: '1.2.4' as const}

    const versions = [
      {timestamp: currentUnixTime() - 100, version: '1.2.4'},
      {timestamp: currentUnixTime() - 100, version: '1.2.3'},
    ]

    const manifest = {
      tags: {
        latest: [
          // stale, can and should be removed
          {timestamp: currentUnixTime() - 60 * 31, version: '1.2.3' as const},
        ],
      },
      versions,
    }
    expect(tagVersion(manifest, 'latest', newEntry, {setAsDefault: true})).toEqual({
      default: newEntry.version,
      tags: {
        latest: [newEntry],
      },
      versions,
    })
  })

  it('applies TTL cleanup for new tag major, keeps highest for other majors', () => {
    const versions = [
      {timestamp: currentUnixTime() - 1000, version: '1.2.4'},
      {timestamp: currentUnixTime() - 2000, version: '2.0.0'},
      {timestamp: currentUnixTime() - 3000, version: '2.1.0'},
    ]

    const manifest = {
      tags: {stable: []},
      versions,
    }

    const tag1 = {timestamp: currentUnixTime() - 20, version: '1.2.4' as const}
    const tag2 = {timestamp: currentUnixTime() - 30, version: '2.1.0' as const}

    const result = tagVersion(tagVersion(manifest, 'stable', tag1), 'stable', tag2)

    expect(result).toEqual({
      tags: {
        stable: [tag2, tag1],
      },
      versions,
    })
  })

  it('allows several tags to be added in a row', () => {
    // in an ideal world, there should just be a single tagged version per channel
    // but to allow for updated manifests to reach all pods, we add new versions with a timestamp,
    // so the module server can serve tags after a period of time has passed
    const versions = [
      {timestamp: currentUnixTime() - 1000, version: '1.2.4'},
      {timestamp: currentUnixTime() - 2000, version: '1.2.3'},
      {timestamp: currentUnixTime() - 3009, version: '1.2.2'},
    ]

    const manifest = {
      tags: {
        stable: [],
      },
      versions,
    }

    const tag1 = {timestamp: currentUnixTime() - 20, version: '1.2.2' as const}
    const tag2 = {timestamp: currentUnixTime() - 30, version: '1.2.3' as const}
    const tag3 = {timestamp: currentUnixTime() - 40, version: '1.2.4' as const}

    const v3 = tagVersion(
      tagVersion(tagVersion(manifest, 'stable', tag1), 'stable', tag2),
      'stable',
      tag3,
    )

    expect(v3).toEqual({
      tags: {
        stable: [tag3, tag2, tag1],
      },
      versions,
    })
  })
})
