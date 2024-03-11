import {describe, expect, test} from 'vitest'

import {at} from '../../mutations/creators'
import {set, setIfMissing, unset} from '../../mutations/operations/creators'
import {squashNodePatches} from '../optimizations/squashNodePatches'

describe('squashNodePatches()', () => {
  test('squashNodePatches() drops set mutations replaced by new ones', () => {
    const nodePatches = [
      at('foo', set('a')),
      at('foo', set('ab')),
      at('foo', set('abc')),
      at('bar', set('x')),
      at('foo', set('abcd')),
    ]

    expect(squashNodePatches(nodePatches)).toEqual([
      at('bar', set('x')),
      at('foo', set('abcd')),
    ])
  })

  test('squashNodePatches() drops intermittent equal setIfMissing patches', () => {
    const nodePatches = [
      at('foo', setIfMissing({})),
      at('foo.a', set('ab')),
      at('foo', setIfMissing({})),
      at('foo.b', set('abc')),
      at('foo', setIfMissing({})),
      at('foo.c', set('abcd')),
    ]

    expect(squashNodePatches(nodePatches)).toEqual([
      at('foo', setIfMissing({})),
      at('foo.a', set('ab')),
      at('foo.b', set('abc')),
      at('foo.c', set('abcd')),
    ])
  })
  test('squashNodePatches() drops intermittent equal setIfMissing patches, but only when theres no unset in between', () => {
    const nodePatches = [
      at('foo', setIfMissing({})),
      at('foo.a', set('ab')),
      at('foo', setIfMissing({})),
      at('foo.b', set('abc')),
      at('foo', unset()),
      at('foo', setIfMissing({})),
      at('foo.c', set('abcd')),
    ]

    expect(squashNodePatches(nodePatches)).toEqual([
      at('foo', unset()),
      at('foo', setIfMissing({})),
      at('foo.c', set('abcd')),
    ])
  })

  test('squashNodePatches() removes earlier patches that targets a path that is later unset ', () => {
    const nodePatches = [
      at('foo', setIfMissing({})),
      at('foo.a', set(false)),
      at('bar', setIfMissing({})),
      at('bar.a', set('bar')),
      at('foo', setIfMissing({})),
      at('foo.b', set(true)),
      at('foo', unset()),
    ]

    expect(squashNodePatches(nodePatches)).toEqual([
      at('bar', setIfMissing({})),
      at('bar.a', set('bar')),
      at('foo', unset()),
    ])
  })
})
