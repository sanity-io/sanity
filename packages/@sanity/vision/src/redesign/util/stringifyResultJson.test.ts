import {describe, expect, it} from 'vitest'

import {MAX_RESULT_JSON_CHARS, stringifyResultJson} from './stringifyResultJson'

describe('stringifyResultJson', () => {
  it('pretty-prints ordinary results', () => {
    expect(stringifyResultJson({a: 1})).toEqual({
      ok: true,
      text: '{\n  "a": 1\n}',
    })
  })

  it('depth-truncates circular values instead of throwing during render', () => {
    const circular: {self?: unknown} = {}
    circular.self = circular
    const result = stringifyResultJson(circular)
    expect(result.ok).toBe(true)
    expect(result.text).toContain('null')
  })

  it('returns an error notice for values that cannot be serialized', () => {
    const result = stringifyResultJson(10n)
    expect(result.ok).toBe(false)
    expect(result).toMatchObject({error: true})
    expect(result.text).toContain('could not be shown as JSON')
  })

  it('truncates enormous payloads before the editor loads them', () => {
    const value = {text: 'x'.repeat(MAX_RESULT_JSON_CHARS)}
    const result = stringifyResultJson(value)
    expect(result.ok).toBe(false)
    expect(result).toMatchObject({truncated: true})
    expect(result.text.length).toBeLessThan(MAX_RESULT_JSON_CHARS + 80)
    expect(result.text).toContain('truncated')
  })
})
