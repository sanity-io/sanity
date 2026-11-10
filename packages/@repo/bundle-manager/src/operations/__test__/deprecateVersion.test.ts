import {describe, expect, it} from 'vitest'

import {currentUnixTime} from '../../utils'
import {deprecateVersion, isDeprecated, undeprecateVersion} from '../deprecateVersion'
import {tagVersion} from '../tagVersion'

describe('deprecateVersion()', () => {
  it('records a deprecation entry for a known version and keeps it in versions', () => {
    const versions = [
      {timestamp: currentUnixTime() - 200, version: '1.2.3'},
      {timestamp: currentUnixTime() - 100, version: '1.2.4'},
    ]
    const timestamp = currentUnixTime()

    expect(
      deprecateVersion({versions}, {version: '1.2.4', timestamp, reason: 'Data loss bug'}),
    ).toEqual({
      versions,
      deprecated: {'1.2.4': {timestamp, reason: 'Data loss bug'}},
    })
  })

  it('omits the reason when none is given', () => {
    const versions = [{timestamp: currentUnixTime() - 200, version: '1.2.3'}]
    const timestamp = currentUnixTime()

    expect(deprecateVersion({versions}, {version: '1.2.3', timestamp})).toEqual({
      versions,
      deprecated: {'1.2.3': {timestamp}},
    })
  })

  it('keeps existing deprecations', () => {
    const versions = [
      {timestamp: currentUnixTime() - 200, version: '1.2.3'},
      {timestamp: currentUnixTime() - 100, version: '1.2.4'},
    ]
    const existing = {'1.2.3': {timestamp: currentUnixTime() - 50}}
    const timestamp = currentUnixTime()

    expect(
      deprecateVersion({versions, deprecated: existing}, {version: '1.2.4', timestamp}).deprecated,
    ).toEqual({...existing, '1.2.4': {timestamp}})
  })

  it('throws if version is not in the version array', () => {
    expect(() =>
      deprecateVersion(
        {versions: [{timestamp: 1749664258097, version: '1.2.3'}]},
        {version: '1.2.4', timestamp: currentUnixTime()},
      ),
    ).toThrowErrorMatchingInlineSnapshot(`[Error: Version "1.2.4" not known]`)
  })
})

describe('undeprecateVersion()', () => {
  it('removes the deprecation entry', () => {
    const versions = [
      {timestamp: currentUnixTime() - 200, version: '1.2.3'},
      {timestamp: currentUnixTime() - 100, version: '1.2.4'},
    ]
    const manifest = {
      versions,
      deprecated: {
        '1.2.3': {timestamp: currentUnixTime() - 50},
        '1.2.4': {timestamp: currentUnixTime() - 40},
      },
    }

    expect(undeprecateVersion(manifest, '1.2.4')).toEqual({
      versions,
      deprecated: {'1.2.3': {timestamp: manifest.deprecated['1.2.3'].timestamp}},
    })
  })

  it('keeps an empty deprecated dict when the last entry is removed', () => {
    const versions = [{timestamp: currentUnixTime() - 200, version: '1.2.3'}]
    const manifest = {versions, deprecated: {'1.2.3': {timestamp: currentUnixTime() - 50}}}

    // an empty map (rather than a missing field) lets consumers tell "cleared" from "unknown"
    expect(undeprecateVersion(manifest, '1.2.3')).toEqual({versions, deprecated: {}})
  })

  it('throws if the version is not deprecated', () => {
    expect(() =>
      undeprecateVersion({versions: [{timestamp: 1749664258097, version: '1.2.3'}]}, '1.2.3'),
    ).toThrowErrorMatchingInlineSnapshot(`[Error: Version "1.2.3" is not deprecated]`)
  })
})

describe('isDeprecated()', () => {
  it('reports deprecation status', () => {
    const deprecated = {'1.2.3': {timestamp: 1}}
    expect(isDeprecated(deprecated, '1.2.3')).toBe(true)
    expect(isDeprecated(deprecated, '1.2.4')).toBe(false)
    expect(isDeprecated(undefined, '1.2.3')).toBe(false)
  })
})

describe('tagVersion() with deprecations', () => {
  it('refuses to tag a deprecated version', () => {
    const versions = [{timestamp: currentUnixTime() - 200, version: '1.2.3'}]
    const manifest = {versions, deprecated: {'1.2.3': {timestamp: currentUnixTime() - 50}}}

    expect(() =>
      tagVersion(manifest, 'latest', {timestamp: currentUnixTime(), version: '1.2.3'}),
    ).toThrowErrorMatchingInlineSnapshot(
      `[Error: Version "1.2.3" is deprecated and cannot be tagged. Undeprecate it first.]`,
    )
  })

  it('keeps the highest non-deprecated stale tag entry instead of a deprecated higher one', () => {
    const newLatest = {timestamp: currentUnixTime(), version: '2.0.0'}
    const staleDeprecated = {timestamp: currentUnixTime() - 60 * 31, version: '1.2.4'}
    const staleGood = {timestamp: currentUnixTime() - 60 * 32, version: '1.2.3'}
    const versions = [newLatest, staleDeprecated, staleGood]
    const manifest = {
      versions,
      tags: {latest: [staleDeprecated, staleGood]},
      deprecated: {'1.2.4': {timestamp: currentUnixTime() - 100}},
    }

    expect(tagVersion(manifest, 'latest', newLatest).tags).toEqual({
      latest: [newLatest, staleGood],
    })
  })
})
