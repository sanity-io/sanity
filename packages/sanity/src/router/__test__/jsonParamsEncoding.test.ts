import {afterEach, describe, expect, test, vi} from 'vitest'

import {decodeJsonParams, encodeJsonParams} from '../utils/jsonParamsEncoding'

afterEach(() => {
  vi.restoreAllMocks()
})

function legacyLatin1Base64(json: string): string {
  return btoa(json)
}

describe('decodeJsonParams', () => {
  test('returns an empty object for a missing or empty segment', () => {
    expect(decodeJsonParams()).toEqual({})
    expect(decodeJsonParams('')).toEqual({})
  })

  test('decodes a modern base64url payload', () => {
    const params = {template: 'author', preview: '/posts/hello'}
    expect(decodeJsonParams(encodeJsonParams(params))).toEqual(params)
  })

  test('roundtrips unicode that cannot be encoded with latin1 base64', () => {
    const params = {title: 'hello ⛳❤️🧀', emoji: '😀'}
    expect(decodeJsonParams(encodeJsonParams(params))).toEqual(params)
  })

  test('falls back to legacy latin1 base64 when the segment is not base64url', () => {
    const json = JSON.stringify({name: 'Blåbærsyltetøy'})
    expect(decodeJsonParams(legacyLatin1Base64(json))).toEqual({name: 'Blåbærsyltetøy'})
  })

  test('falls back to raw JSON when the segment is not base64', () => {
    expect(decodeJsonParams('{"id":"doc-1","n":2}')).toEqual({id: 'doc-1', n: 2})
  })

  test('URI-decodes the segment before parsing', () => {
    expect(decodeJsonParams(encodeURIComponent('{"from":"query"}'))).toEqual({from: 'query'})
  })

  test('returns an empty object and warns when every decode path fails', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)

    expect(decodeJsonParams('not-json-or-base64')).toEqual({})
    expect(warn).toHaveBeenCalledWith('Failed to parse JSON parameters')
  })
})

describe('encodeJsonParams', () => {
  test('returns an empty string for a missing or falsy payload', () => {
    expect(encodeJsonParams()).toBe('')
    expect(encodeJsonParams(undefined)).toBe('')
    expect(encodeJsonParams(null)).toBe('')
    expect(encodeJsonParams(0)).toBe('')
    expect(encodeJsonParams('')).toBe('')
    expect(encodeJsonParams(false)).toBe('')
  })

  test('encodes an object as a base64url path segment without padding or url-unsafe characters', () => {
    const encoded = encodeJsonParams({a: 1, nested: {ok: true}})

    expect(encoded).not.toMatch(/[+/=]/)
    expect(decodeJsonParams(encoded)).toEqual({a: 1, nested: {ok: true}})
  })

  test('encodes an empty object because it is truthy', () => {
    const encoded = encodeJsonParams({})

    expect(encoded).not.toBe('')
    expect(decodeJsonParams(encoded)).toEqual({})
  })
})
