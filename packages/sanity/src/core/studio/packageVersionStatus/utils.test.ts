import semver from 'semver'
import {describe, expect, it} from 'vitest'

import {getVersionDeprecation, parseDeprecatedVersions, parseImportMapModuleCdnUrl} from './utils'

describe('parseImportMapModuleCdnUrl for legacy urls', () => {
  it('returns undefined but warns if an invalid module url is given', () => {
    expect(parseImportMapModuleCdnUrl('invalid url')).toMatchInlineSnapshot(`
      {
        "error": [Error: Unable to parse module CDN URL: /invalid%20url],
        "valid": false,
      }
    `)
  })
  it('works with valid module cdn url', () => {
    expect(
      parseImportMapModuleCdnUrl(
        'https://example.com/v1/modules/sanity/default/%5E4.1.1/t1754072932',
      ),
    ).toMatchInlineSnapshot(`
      {
        "appId": undefined,
        "minVersion": "^4.1.1",
        "valid": true,
      }
    `)
  })
  it('works with module cdn path', () => {
    expect(parseImportMapModuleCdnUrl('/v1/modules/sanity/default/%5E4.1.1/t1754072932'))
      .toMatchInlineSnapshot(`
      {
        "appId": undefined,
        "minVersion": "^4.1.1",
        "valid": true,
      }
    `)
  })
  it('works with channel in url', () => {
    expect(parseImportMapModuleCdnUrl('/v1/modules/sanity/next/%5E4.1.1/t1754072932'))
      .toMatchInlineSnapshot(`
      {
        "appId": undefined,
        "minVersion": "^4.1.1",
        "valid": true,
      }
    `)
  })
  it('returns parse error if semver is invalid', () => {
    expect(parseImportMapModuleCdnUrl('/v1/modules/sanity/next/4.0.0.0/t1754072932'))
      .toMatchInlineSnapshot(`
      {
        "error": [Error: Invalid minVersion "4.0.0.0" in module cdn url: /v1/modules/sanity/next/4.0.0.0/t1754072932],
        "valid": false,
      }
    `)
  })
})
describe('parseImportMapModuleCdnUrl for app-id urls', () => {
  it('returns parse error if an invalid module url is given', () => {
    expect(parseImportMapModuleCdnUrl('invalid url')).toMatchInlineSnapshot(`
      {
        "error": [Error: Unable to parse module CDN URL: /invalid%20url],
        "valid": false,
      }
    `)
  })
  it('works with valid module cdn url', () => {
    expect(
      parseImportMapModuleCdnUrl(
        'https://example.com/v1/modules/by-app/appid123/t1755874170/%5E4.1.1/sanity',
      ),
    ).toMatchInlineSnapshot(`
      {
        "appId": "appid123",
        "minVersion": "^4.1.1",
        "valid": true,
      }
    `)
  })
  it('works with module cdn path', () => {
    expect(parseImportMapModuleCdnUrl('/v1/modules/by-app/appid123/t1755874170/%5E4.1.1/sanity'))
      .toMatchInlineSnapshot(`
      {
        "appId": "appid123",
        "minVersion": "^4.1.1",
        "valid": true,
      }
    `)
  })
  it('returns parse error if semver is invalid', () => {
    expect(parseImportMapModuleCdnUrl('/v1/modules/by-app/appid123/t1755874170/%5E4.1.1.1/sanity'))
      .toMatchInlineSnapshot(`
      {
        "error": [Error: Invalid minVersion "^4.1.1.1" in module cdn url: /v1/modules/by-app/appid123/t1755874170/%5E4.1.1.1/sanity],
        "valid": false,
      }
    `)
  })
})

describe('parseDeprecatedVersions()', () => {
  it('returns undefined when the field is missing or malformed', () => {
    expect(parseDeprecatedVersions(undefined)).toBeUndefined()
    expect(parseDeprecatedVersions(null)).toBeUndefined()
    expect(parseDeprecatedVersions('4.2.0')).toBeUndefined()
    expect(parseDeprecatedVersions(['4.2.0'])).toBeUndefined()
  })

  it('returns an empty map when nothing is deprecated', () => {
    expect(parseDeprecatedVersions({})).toEqual({})
  })

  it('keeps reasons and normalizes version keys', () => {
    expect(
      parseDeprecatedVersions({
        '4.2.0': {reason: 'Data loss bug', timestamp: 1},
        'v4.1.0': {},
        '4.0.0': null,
        'not-a-version': {reason: 'ignored'},
      }),
    ).toEqual({
      '4.2.0': {reason: 'Data loss bug'},
      '4.1.0': {},
      '4.0.0': {},
    })
  })
})

describe('getVersionDeprecation()', () => {
  const deprecated = {'4.2.0': {reason: 'Data loss bug'}, '4.1.0': {}}

  it('looks up the deprecation notice for a version', () => {
    expect(getVersionDeprecation(deprecated, semver.parse('4.2.0')!)).toEqual({
      reason: 'Data loss bug',
    })
    expect(getVersionDeprecation(deprecated, semver.parse('4.1.0')!)).toEqual({})
    expect(getVersionDeprecation(deprecated, semver.parse('4.3.0')!)).toBeUndefined()
  })

  it('returns undefined without a list or version', () => {
    expect(getVersionDeprecation(undefined, semver.parse('4.2.0')!)).toBeUndefined()
    expect(getVersionDeprecation(deprecated, undefined)).toBeUndefined()
  })
})
