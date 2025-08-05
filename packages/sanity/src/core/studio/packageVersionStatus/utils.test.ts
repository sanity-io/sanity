import {describe, expect, it, vi} from 'vitest'

import {getBaseVersionFromModuleCDNUrl} from './utils'

describe('getBaseVersionFromModuleCDNUrl', () => {
  it('returns undefined but warns if an invalid module url is given', () => {
    const logSpy = vi.spyOn(console, 'warn').mockImplementation(() => {
      // don't pollute tests
    })
    expect(getBaseVersionFromModuleCDNUrl('invalid url')).toMatchInlineSnapshot(`undefined`)
    expect(logSpy).toHaveBeenCalled()
    expect(logSpy.mock.calls).toMatchInlineSnapshot(`
      [
        [
          [Error: Unable to extract base version from import map, auto updates may not work as expected],
        ],
      ]
    `)

    logSpy.mockRestore()
  })
  it('works with valid module cdn url', () => {
    expect(
      getBaseVersionFromModuleCDNUrl(
        'https://example.com/v1/modules/sanity/default/%5E4.1.1/t1754072932',
      ),
    ).toMatchInlineSnapshot(`"^4.1.1"`)
  })
  it('works with module cdn path', () => {
    expect(
      getBaseVersionFromModuleCDNUrl('/v1/modules/sanity/default/%5E4.1.1/t1754072932'),
    ).toMatchInlineSnapshot(`"^4.1.1"`)
  })
  it('works with channel in url', () => {
    expect(
      getBaseVersionFromModuleCDNUrl('/v1/modules/sanity/next/%5E4.1.1/t1754072932'),
    ).toMatchInlineSnapshot(`"^4.1.1"`)
  })
  it('returns undefined if semver is invalid', () => {
    expect(
      getBaseVersionFromModuleCDNUrl('/v1/modules/sanity/next/4.0.0.0/t1754072932'),
    ).toMatchInlineSnapshot('undefined')
  })
})
