import {describe, expect, it} from 'vitest'

import {DEFAULT_PARAMS} from '../store/visionStorage'
import {formatParams} from './formatParams'

describe('formatParams', () => {
  it('indents the params as JSON', () => {
    expect(formatParams('{"type":"author","ids":["a","b"]}')).toBe(
      '{\n  "type": "author",\n  "ids": [\n    "a",\n    "b"\n  ]\n}',
    )
  })

  it('turns JSON5 into JSON', () => {
    expect(formatParams("{\n  type: 'author',\n}")).toBe('{\n  "type": "author"\n}')
  })

  it('offers nothing for params that are already formatted', () => {
    expect(formatParams('{\n  "type": "author"\n}')).toBeNull()
  })

  it('offers nothing for empty params, in any spacing', () => {
    expect(formatParams(DEFAULT_PARAMS)).toBeNull()
    expect(formatParams('{}')).toBeNull()
    expect(formatParams('{ }')).toBeNull()
  })

  it('offers nothing for params that do not parse or are not an object', () => {
    expect(formatParams('{"type": ')).toBeNull()
    expect(formatParams('')).toBeNull()
    expect(formatParams('["a"]')).toBeNull()
    expect(formatParams('"a"')).toBeNull()
  })

  it('offers nothing for params with comments, which JSON would drop', () => {
    expect(formatParams('{type: "author" // the type\n}')).toBeNull()
    expect(formatParams('{/* the type */ type: "author"}')).toBeNull()
  })

  it('formats params whose strings contain comment markers', () => {
    expect(formatParams('{"url":"https://example.com/*"}')).toBe(
      '{\n  "url": "https://example.com/*"\n}',
    )
    expect(formatParams(`{note: 'it\\'s // fine'}`)).toBe('{\n  "note": "it\'s // fine"\n}')
  })
})
