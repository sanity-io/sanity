import {describe, expect, it} from 'vitest'

import {isExactMatchToken, isNegationToken, isPrefixToken, prefixLast} from '../token'

describe('isNegationToken', () => {
  it('identifies negation tokens', () => {
    expect(isNegationToken('-test')).toBe(true)
    expect(isNegationToken('--')).toBe(true)
    expect(isNegationToken('test')).toBe(false)
    expect(isNegationToken('test-')).toBe(false)
    expect(isNegationToken(undefined)).toBe(false)
  })
})

describe('isPrefixToken', () => {
  it('identifies prefix tokens', () => {
    expect(isPrefixToken('test*')).toBe(true)
    expect(isPrefixToken('test')).toBe(false)
    expect(isPrefixToken('*test')).toBe(false)
    expect(isPrefixToken(undefined)).toBe(false)
  })
})

describe('prefixLast', () => {
  it('transforms the final non-negation token into a wildcard prefix', () => {
    expect(prefixLast('a')).toBe('a*')
    expect(prefixLast('a b')).toBe('a b*')
    expect(prefixLast('a -b')).toBe('a* -b')
    expect(prefixLast('a "bc" d')).toBe('a "bc" d*')
    expect(prefixLast('ab "cd"')).toBe('ab* "cd"')
    expect(prefixLast('a --')).toBe('a* --')
  })

  it('does not transform the final non-negation token if it is already a wildcard prefix', () => {
    expect(prefixLast('a*')).toBe('a*')
    expect(prefixLast('a* -b')).toBe('a* -b')
  })

  it('does not transform any tokens if only negation tokens are present', () => {
    expect(prefixLast('-a -b')).toBe('-a -b')
    expect(prefixLast('--')).toBe('--')
  })

  it('trims tokens', () => {
    expect(prefixLast('a   "ab   c"   d')).toBe('a "ab   c" d*')
  })

  it('preserves quoted tokens', () => {
    expect(prefixLast('"a b" c d')).toBe('"a b" c d*')
    expect(prefixLast('"a   b"   c d  "ef" "g  "')).toBe('"a   b" c d* "ef" "g  "')
    expect(prefixLast('"a " b" c d')).toBe('"a " b c d*')
  })
})

describe('isExactMatchToken', () => {
  it('recognises that a token is encased in quote marks', () => {
    expect(isExactMatchToken(undefined)).toBe(false)
    expect(isExactMatchToken('"a"')).toBe(true)
    expect(isExactMatchToken('"a b"')).toBe(true)
    expect(isExactMatchToken('"a')).toBe(false)
    expect(isExactMatchToken('a"')).toBe(false)
    expect(isExactMatchToken('"a b')).toBe(false)
    expect(isExactMatchToken('a b"')).toBe(false)
  })
})
