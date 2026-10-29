import {describe, expect, test} from 'vitest'

import {makeVFlagSafe} from '../vFlagSafeRegexp'

/** Regexp sources that appear in, or plausibly appear in, a Presentation route pattern. */
const SOURCES = [
  '.*',
  '\\d+',
  'en|no',
  '[a-z]',
  '[a-z]+',
  '[a-z0-9]+',
  '[a-z0-9-]+',
  '[-a-z]+',
  '[a-z_-]+',
  '[\\w-]+',
  '[^/]+',
  '[^/]*',
  '[a-z]{2}',
  '[a-z]{2,3}',
  '(?:a|b)',
  '\\p{Letter}+',
  '[a-z\\-0-9]+',
  '[a-z-0-9]+',
  '[a-z](?:[a-z0-9-]*[a-z0-9])?',
  '[.]+',
]

/** Inputs used to check that escaping did not change what a regexp matches. */
const SAMPLES = [
  '',
  'a',
  'z',
  '-',
  '--',
  'a-b',
  'abc',
  'ABC',
  '0',
  '123',
  'a1',
  'en',
  'no',
  '_',
  '/',
  'a/b',
  '.',
  '..',
  'café',
]

function compile(source: string, flags: string): RegExp | undefined {
  try {
    return new RegExp(`^(?:${source})$`, flags)
  } catch {
    return undefined
  }
}

function compiles(source: string, flags: string): boolean {
  return compile(source, flags) !== undefined
}

describe('makeVFlagSafe', () => {
  test('escapes only what the v flag requires', () => {
    expect(SOURCES.map((source) => [source, makeVFlagSafe(source)])).toMatchInlineSnapshot(`
      [
        [
          ".*",
          ".*",
        ],
        [
          "\\d+",
          "\\d+",
        ],
        [
          "en|no",
          "en|no",
        ],
        [
          "[a-z]",
          "[a-z]",
        ],
        [
          "[a-z]+",
          "[a-z]+",
        ],
        [
          "[a-z0-9]+",
          "[a-z0-9]+",
        ],
        [
          "[a-z0-9-]+",
          "[a-z0-9\\-]+",
        ],
        [
          "[-a-z]+",
          "[\\-a-z]+",
        ],
        [
          "[a-z_-]+",
          "[a-z_\\-]+",
        ],
        [
          "[\\w-]+",
          "[\\w\\-]+",
        ],
        [
          "[^/]+",
          "[^\\/]+",
        ],
        [
          "[^/]*",
          "[^\\/]*",
        ],
        [
          "[a-z]{2}",
          "[a-z]{2}",
        ],
        [
          "[a-z]{2,3}",
          "[a-z]{2,3}",
        ],
        [
          "(?:a|b)",
          "(?:a|b)",
        ],
        [
          "\\p{Letter}+",
          "\\p{Letter}+",
        ],
        [
          "[a-z\\-0-9]+",
          "[a-z\\-0-9]+",
        ],
        [
          "[a-z-0-9]+",
          "[a-z\\-0-9]+",
        ],
        [
          "[a-z](?:[a-z0-9-]*[a-z0-9])?",
          "[a-z](?:[a-z0-9\\-]*[a-z0-9])?",
        ],
        [
          "[.]+",
          "[.]+",
        ],
      ]
    `)
  })

  for (const source of SOURCES) {
    test(`${source} compiles under both u and v once escaped`, () => {
      // Every source is meant to be valid under `u`, which is what the polyfill uses.
      expect(compiles(source, 'u')).toBe(true)
      const safe = makeVFlagSafe(source)
      expect(compiles(safe, 'u')).toBe(true)
      expect(compiles(safe, 'v')).toBe(true)
    })

    test(`${source} matches the same input once escaped`, () => {
      const original = new RegExp(`^(?:${source})$`, 'u')
      const safe = new RegExp(`^(?:${makeVFlagSafe(source)})$`, 'v')
      for (const sample of SAMPLES) {
        expect(safe.test(sample), `${source} × ${JSON.stringify(sample)}`).toBe(
          original.test(sample),
        )
      }
    })
  }

  test('these are the sources a native URLPattern rejects without escaping', () => {
    const rejectedByV = SOURCES.filter((source) => !compiles(source, 'v'))
    expect(rejectedByV).toMatchInlineSnapshot(`
      [
        "[a-z0-9-]+",
        "[-a-z]+",
        "[a-z_-]+",
        "[\\w-]+",
        "[^/]+",
        "[^/]*",
        "[a-z-0-9]+",
        "[a-z](?:[a-z0-9-]*[a-z0-9])?",
      ]
    `)
    // …and every one of them is fixed by escaping.
    expect(rejectedByV.filter((source) => !compiles(makeVFlagSafe(source), 'v'))).toEqual([])
  })

  test('leaves regexps without character classes alone', () => {
    expect(makeVFlagSafe('\\d+')).toBe('\\d+')
    expect(makeVFlagSafe('a-b')).toBe('a-b')
    expect(makeVFlagSafe('(?:a|b)')).toBe('(?:a|b)')
  })

  test('keeps ranges intact and escapes lone hyphens', () => {
    expect(makeVFlagSafe('[a-z]')).toBe('[a-z]')
    expect(makeVFlagSafe('[a-z-]')).toBe('[a-z\\-]')
    expect(makeVFlagSafe('[-a-z]')).toBe('[\\-a-z]')
    expect(makeVFlagSafe('[a-z-0-9]')).toBe('[a-z\\-0-9]')
    expect(makeVFlagSafe('[^-]')).toBe('[^\\-]')
  })

  test('leaves an unterminated character class to the engine', () => {
    expect(makeVFlagSafe('[a-z')).toBe('[a-z')
  })
})
