import {describe, expect, test} from 'vitest'

import {
  assign,
  dec,
  diffMatchPatch,
  inc,
  set,
  setIfMissing,
  unassign,
  unset,
} from '../../../mutations/operations/creators'
import {applyOp} from '../applyOp'

describe('set/unset', () => {
  test('set on any type of value', () => {
    expect(applyOp(set('baz'), {foo: 'bar'})).toEqual('baz')
    expect(applyOp(set('baz'), 'bar')).toEqual('baz')
    expect(applyOp(set('baz'), 42)).toEqual('baz')
    expect(applyOp(set('baz'), true)).toEqual('baz')
    expect(applyOp(set('baz'), [])).toEqual('baz')
  })
  test('unset on any type of value', () => {
    expect(applyOp(unset(), {foo: 'bar'})).toEqual(undefined)
    expect(applyOp(unset(), 'bar')).toEqual(undefined)
    expect(applyOp(unset(), 42)).toEqual(undefined)
    expect(applyOp(unset(), true)).toEqual(undefined)
    expect(applyOp(unset(), [])).toEqual(undefined)
  })
})

describe('setIfMissing', () => {
  test('setIfMissing on any existing value', () => {
    expect(applyOp(setIfMissing('baz'), {foo: 'bar'})).toEqual({foo: 'bar'})
    expect(applyOp(setIfMissing('baz'), 'bar')).toEqual('bar')
    expect(applyOp(setIfMissing('baz'), '')).toEqual('')
    expect(applyOp(setIfMissing('baz'), 0)).toEqual(0)
    expect(applyOp(setIfMissing('baz'), 42)).toEqual(42)
    expect(applyOp(setIfMissing('baz'), true)).toEqual(true)
    expect(applyOp(setIfMissing('baz'), false)).toEqual(false)
    expect(applyOp(setIfMissing('baz'), [])).toEqual([])
    expect(applyOp(setIfMissing('baz'), {})).toEqual({})
  })
  test('setIfMissing on any nonexisting value', () => {
    expect(applyOp(setIfMissing('baz'), undefined)).toEqual('baz')
    expect(applyOp(setIfMissing('baz'), null)).toEqual('baz')
  })
})

describe('inc/dec', () => {
  test('inc', () => {
    expect(applyOp(inc(1), 1)).toEqual(2)
    expect(applyOp(inc(1), 1)).toEqual(2)
    expect(applyOp(inc(10), 1)).toEqual(11)

    expect(applyOp(inc(-1), 1)).toEqual(0)
    expect(applyOp(inc(-10), 1)).toEqual(-9)
  })
  test('dec', () => {
    expect(applyOp(dec(-1), 1)).toEqual(2)
    expect(applyOp(dec(-10), 1)).toEqual(11)
    expect(applyOp(dec(1), 1)).toEqual(0)
    expect(applyOp(dec(10), 1)).toEqual(-9)
  })
})

test('diffMatchPatch', () => {
  expect(
    applyOp(
      diffMatchPatch('@@ -1,11 +1,11 @@\n foo ba\n-z\n+r \n baz\n'),
      'foo baz baz',
    ),
  ).toEqual('foo bar baz')
  expect(
    applyOp(diffMatchPatch('@@ -1,11 +1,11 @@\n foo ba\n-z\n+r\n baz\n'), 'ok'),
  ).toEqual('ok')
})

describe('assign/unassign', () => {
  test('assign', () => {
    expect(applyOp(assign({foo: 'bar'}), {})).toEqual({
      foo: 'bar',
    })
    expect(applyOp(assign({foo: 'bar'}), {bar: 'baz'})).toEqual({
      foo: 'bar',
      bar: 'baz',
    })
  })
  test('unassign', () => {
    expect(applyOp(unassign(['bar']), {foo: 'foo', bar: 'baz'})).toEqual({
      foo: 'foo',
    })
    expect(applyOp(unassign(['foo', 'bar']), {foo: 'foo', bar: 'baz'})).toEqual(
      {},
    )
  })
})
