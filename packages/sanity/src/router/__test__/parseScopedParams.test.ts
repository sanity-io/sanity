import {describe, expect, test} from 'vitest'

import {parseScopedParams} from '../utils/parseScopedParams'

describe('parseScopedParams', () => {
  test('returns an empty list when there are no params', () => {
    expect(parseScopedParams([])).toEqual([])
  })

  test('treats a key without brackets as a single namespace segment', () => {
    expect(parseScopedParams([['view', 'zen']])).toEqual([[['view'], 'zen']])
  })

  test('splits one pair of brackets into a two-segment namespace', () => {
    expect(parseScopedParams([['omg[something]', 'xyz']])).toEqual([[['omg', 'something'], 'xyz']])
  })

  test('splits stacked brackets into a deeper namespace path', () => {
    expect(parseScopedParams([['first[second][c]', 'd']])).toEqual([
      [['first', 'second', 'c'], 'd'],
    ])
  })

  test('maps each param independently and keeps its value', () => {
    expect(
      parseScopedParams([
        ['first[a]', 'b'],
        ['first[second][c]', 'd'],
        ['plain', '1'],
      ]),
    ).toEqual([
      [['first', 'a'], 'b'],
      [['first', 'second', 'c'], 'd'],
      [['plain'], '1'],
    ])
  })

  test('treats a key that starts with a bracket as a single segment', () => {
    expect(parseScopedParams([['[only]', 'v']])).toEqual([[['only'], 'v']])
  })

  test('appends trailing text after the last closing bracket as another segment', () => {
    expect(parseScopedParams([['foo[bar]baz', 'v']])).toEqual([[['foo', 'bar', 'baz'], 'v']])
  })

  test('keeps an empty segment when the brackets are empty', () => {
    expect(parseScopedParams([['foo[]', 'v']])).toEqual([[['foo', ''], 'v']])
  })

  test('returns an empty namespace for an empty key', () => {
    expect(parseScopedParams([['', 'v']])).toEqual([[[], 'v']])
  })

  test('preserves empty and special-character values', () => {
    expect(
      parseScopedParams([
        ['scope[q]', ''],
        ['scope[path]', '/posts/hello'],
        ['scope[title]', 'hello ⛳'],
      ]),
    ).toEqual([
      [['scope', 'q'], ''],
      [['scope', 'path'], '/posts/hello'],
      [['scope', 'title'], 'hello ⛳'],
    ])
  })

  test('throws when a bracket is left unclosed', () => {
    expect(() => parseScopedParams([['foo[bar', 'v']])).toThrow('Unclosed bracket')
    expect(() => parseScopedParams([['[foo', 'v']])).toThrow('Unclosed bracket')
    expect(() => parseScopedParams([['[', 'v']])).toThrow('Unclosed bracket')
  })

  test('treats an inner opening bracket as part of the segment up to the first close', () => {
    expect(parseScopedParams([['foo[bar[baz]]', 'v']])).toEqual([[['foo', 'bar[baz', ']'], 'v']])
  })
})
