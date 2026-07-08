import {describe, expect, it} from 'vitest'

import {isReloadableVersion, parseImportMapModuleCdnUrl} from './utils'

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

describe('isReloadableVersion', () => {
  it('accepts versions within the import map range', () => {
    expect(isReloadableVersion('5.32.0', '^5.31.1')).toBe(true)
    expect(isReloadableVersion('5.31.1', '^5.31.1')).toBe(true)
    // downgrades within the range (e.g. a version pinned via manage) are still reachable
    expect(isReloadableVersion('5.25.0', '^5.20.0')).toBe(true)
  })
  it('rejects versions outside the import map range', () => {
    // a new major will never be served on reload
    expect(isReloadableVersion('6.4.0', '^5.31.1')).toBe(false)
    expect(isReloadableVersion('4.9.0', '^5.31.1')).toBe(false)
  })
  it('accepts prerelease versions within the range', () => {
    expect(isReloadableVersion('5.32.0-next.5', '^5.31.1')).toBe(true)
    // but not prereleases of the next major
    expect(isReloadableVersion('6.0.0-next.1', '^5.31.1')).toBe(false)
  })
})
