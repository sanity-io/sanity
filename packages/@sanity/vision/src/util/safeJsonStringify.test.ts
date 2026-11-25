import {describe, expect, it} from 'vitest'

import {MAX_SAFE_JSON_DEPTH, safeJsonStringify} from './safeJsonStringify'

describe('safeJsonStringify', () => {
  it('stringifies ordinary values', () => {
    expect(safeJsonStringify({a: 1})).toBe('{"a":1}')
    expect(safeJsonStringify({a: 1}, 2)).toBe('{\n  "a": 1\n}')
  })

  it('returns undefined for BigInt', () => {
    expect(safeJsonStringify(10n)).toBeUndefined()
  })

  it('depth-truncates circular structures instead of throwing', () => {
    const circular: {self?: unknown} = {}
    circular.self = circular
    const json = safeJsonStringify(circular)
    expect(json).toBeTypeOf('string')
    expect(json).toContain('null')
  })

  it('truncates trees past MAX_SAFE_JSON_DEPTH', () => {
    let deep: Record<string, unknown> = {x: 1}
    for (let index = 0; index < MAX_SAFE_JSON_DEPTH + 8; index++) {
      deep = {nested: deep}
    }
    const json = safeJsonStringify(deep)
    expect(json).toBeTypeOf('string')
    expect(json).toContain('null')
    // The leaf is past the cap, so it must not appear in the output
    expect(json).not.toContain('"x"')
  })

  it('keeps trees within MAX_SAFE_JSON_DEPTH intact', () => {
    let deep: Record<string, unknown> = {x: 1}
    for (let index = 0; index < MAX_SAFE_JSON_DEPTH - 1; index++) {
      deep = {nested: deep}
    }
    const json = safeJsonStringify(deep)
    expect(json).toBeTypeOf('string')
    expect(json).toContain('"x":1')
    expect(json).not.toContain('null')
  })
})
