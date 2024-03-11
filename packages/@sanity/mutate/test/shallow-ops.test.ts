import {expect, expectTypeOf, test} from 'vitest'

import {
  assign,
  dec,
  diffMatchPatch,
  inc,
  insert,
  replace,
  set,
  setIfMissing,
  unassign,
  unset,
} from '../src'
import {applyOp} from '../src/apply'

test('Apply operation on value', () => {
  expect(applyOp(inc(1), 1)).toBe(2)
  expect(applyOp(dec(1), 1)).toBe(0)
  expect(applyOp(set('new value'), 'old value')).toBe('new value')
  expect(applyOp(unset(), 'old value')).toBeUndefined()
  expect(applyOp(setIfMissing('ok'), undefined)).toEqual('ok')
  expect(applyOp(setIfMissing('not ok'), 'ok')).toEqual('ok')
  expect(applyOp(assign({a: 'a'}), {b: 'b'})).toEqual({a: 'a', b: 'b'})
  expect(applyOp(unassign(['a', 'b']), {a: 'a', b: 'b', c: 'c'})).toEqual({
    c: 'c',
  })
  expect(
    applyOp(
      diffMatchPatch(`@@ -1,11 +1,11 @@\n Foo ba\n-z\n+r\n  baz`),
      'Foo baz baz',
    ),
  ).toEqual('Foo bar baz')
  expect(applyOp(insert(['foo'], 'after', 0), [])).toEqual(['foo'])
  expect(applyOp(replace(['c', 'd'], 2), ['a', 'b', '-', '-', 'e'])).toEqual([
    'a',
    'b',
    'c',
    'd',
    'e',
  ])
})

test('typings', () => {
  expectTypeOf(applyOp(set('b' as const), 'a')).toEqualTypeOf<'b'>()
  expectTypeOf(applyOp(set({foo: 'bar'} as const), ['foo']))
  expectTypeOf<readonly ['foo']>(applyOp(setIfMissing('foo'), ['foo']))

  try {
    expectTypeOf<undefined>(applyOp(unset(), 'old value'))
  } catch {
    // do nothing
  }

  // @ts-expect-error can't pass string as argument to inc()
  applyOp(inc('10'), 10)
  // @ts-expect-error can't increment a string
  expect(() => applyOp(inc(1), '10')).toThrow(TypeError)
  // @ts-expect-error can't pass string as argument to dec()
  applyOp(dec('10'), 10)
  // @ts-expect-error can't decrement a string
  expect(() => applyOp(dec(1), '10')).toThrow(TypeError)

  expectTypeOf<(string | number)[]>(
    applyOp(insert([1, 2, 3], 'after', 0), ['foo', 'bar']),
  )

  expectTypeOf<number[]>(applyOp(insert([1, 2, 3], 'after', 0), [2]))

  // @ts-expect-error inserting numbers into array of strings
  applyOp<number[]>(insert([1, 2, 3], 'after', 0), ['Not a number'])

  // Ok, since the array is declared as (number|string)[]
  expectTypeOf<(number | string)[]>(
    applyOp(insert([1, 2, 3], 'after', 0), ['Not a number'] as (
      | number
      | string
    )[]),
  )

  expectTypeOf<{a: string; b: number}>(
    applyOp(assign({a: 'ok'}), {
      b: 22,
    }),
  )

  expectTypeOf<{a: string; b: string}>(
    // @ts-expect-error should error since we're removing "b" from the object
    applyOp(unassign(['b']), {
      a: 'ok',
      b: 22,
    }),
  )

  // @ts-expect-error can not apply array operation on object
  expect(() => applyOp(insert(['a'], 'before', 0), {})).toThrow(TypeError)

  // @ts-expect-error can not apply array operation on object
  expect(() => applyOp(replace(['a'], 0), {})).toThrow(TypeError)
})
