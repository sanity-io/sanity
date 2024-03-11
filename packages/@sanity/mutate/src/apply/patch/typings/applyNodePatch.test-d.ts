/* eslint-disable @typescript-eslint/ban-types */
import {assertType, describe, test} from 'vitest'

import {
  type DecOp,
  type IncOp,
  type SetIfMissingOp,
  type SetOp,
} from '../../../mutations/operations/types'
import {type NodePatch} from '../../../mutations/types'
import {
  type ApplyAtIndex,
  type ApplyAtPath,
  type ApplyAtSelector,
  type ApplyNodePatch,
  type FirstIndexOf,
} from './applyNodePatch'

describe('helpers', () => {
  assertType<
    FirstIndexOf<
      0,
      {_key: 'foo'},
      [
        {_key: 'bar'; name: 'second'},
        {_key: 'baz'; name: 'third'},
        {_key: 'foo'; name: 'first'},
      ]
    >
  >(2)
  assertType<
    ApplyAtIndex<
      1,
      ['name'],
      SetOp<'replaced'>,
      [{name: 'first'}, {name: 'second'}, {name: 'third'}]
    >
  >([{name: 'first'}, {name: 'replaced'}, {name: 'third'}])

  assertType<
    ApplyAtSelector<
      {_key: 'baz'},
      ['name'],
      SetOp<'replaced'>,
      [
        {_key: 'bar'; name: 'second'},
        {_key: 'baz'; name: 'third'},
        {_key: 'foo'; name: 'first'},
      ]
    >
  >([
    {_key: 'bar', name: 'second'},
    {_key: 'baz', name: 'replaced'},
    {_key: 'foo', name: 'first'},
  ])
})

test('The ApplyAtPath type', () => {
  assertType<ApplyAtPath<['new'], SetIfMissingOp<'yes'>, {exists: 'yes'}>>({
    exists: 'yes',
    new: 'yes',
  })

  assertType<ApplyAtPath<['ok', 'not', 'ok'], SetOp<'written'>, {foo: 'bar'}>>({
    foo: 'bar',
  })

  assertType<
    ApplyAtPath<['arr', 0, 'value'], SetOp<'new'>, {arr: [{value: 'old'}]}>
  >({arr: [{value: 'new'}]})

  assertType<
    ApplyAtPath<
      ['arr', {_key: 'foo'}, 'name'],
      SetOp<'new name'>,
      {
        arr: [
          {_key: 'bar'; name: 'second'},
          {_key: 'foo'; name: 'first'},
          {_key: 'baz'; name: 'third'},
        ]
      }
    >
  >({
    arr: [
      {_key: 'bar', name: 'second'},
      {_key: 'foo', name: 'new name'},
      {_key: 'baz', name: 'third'},
    ],
  })
})

describe('The ApplyNodePatch type', () => {
  test('set patch at an existing path', () => {
    assertType<
      ApplyNodePatch<
        NodePatch<['foo', 'bar'], SetOp<'new'>>,
        {
          foo: {
            bar: 'current'
          }
          bar: 'ok'
        }
      >
    >({
      foo: {bar: 'new'},
      bar: 'ok',
    })
  })

  test('assignIfMissing patch at a missing path', () => {
    type T = ApplyNodePatch<
      NodePatch<['foo'], SetIfMissingOp<{barz: 'new'}>>,
      {
        foo: {other: 'ok'}
        bar: 'ok'
      }
    >
    assertType<
      ApplyNodePatch<
        NodePatch<['foo', 'bar'], SetIfMissingOp<'new'>>,
        {
          foo: {other: 'ok'}
          bar: 'ok'
        }
      >
    >({
      foo: {bar: 'new', other: 'ok'},
      bar: 'ok',
    })
  })
  test('inc patch at an existing path', () => {
    assertType<
      ApplyNodePatch<
        NodePatch<['foo', 'num'], IncOp<1>>,
        {
          foo: {num: 3}
          bar: 'ok'
        }
      >
    >({
      foo: {num: 4},
      bar: 'ok',
    })
  })
  test('dec patch at an existing path', () => {
    assertType<
      ApplyNodePatch<
        NodePatch<['foo', 'num'], DecOp<1>>,
        {
          foo: {num: 3}
          bar: 'ok'
        }
      >
    >({
      foo: {num: 2},
      bar: 'ok',
    })
  })
  test('dec patch at an existing path', () => {
    assertType<
      ApplyNodePatch<
        NodePatch<['foo', 'num'], DecOp<1>>,
        {
          foo: {num: 3}
          bar: 'ok'
        }
      >
    >({
      foo: {num: 2},
      bar: 'ok',
    })
  })
})
