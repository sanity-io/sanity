import {assertType, expectTypeOf, test} from 'vitest'

import {
  assign,
  dec,
  inc,
  set,
  setIfMissing,
  unassign,
  unset,
} from '../../../mutations/operations/creators'
import {
  type AssignOp,
  type DecOp,
  type IncOp,
  type InsertOp,
  type ReplaceOp,
  type SetIfMissingOp,
  type SetOp,
  type UnassignOp,
  type UnsetOp,
} from '../../../mutations/operations/types'
import {applyOp} from '../applyOp'
import {
  type AdjustIndex,
  type ApplyOp,
  type InsertAtIndex,
  type NormalizeIndex,
  type SplitAtPos,
} from './applyOp'

test('various support types', () => {
  assertType<InsertAtIndex<[1, 2, 3], [4, 5, 6], 'after', -1>>([
    1, 2, 3, 4, 5, 6,
  ])
  assertType<InsertAtIndex<[], [4, 5, 6], 'after', -2>>([])
  assertType<InsertAtIndex<[1], [4, 5, 6], 'after', -2>>([1])
  assertType<InsertAtIndex<[1, 2], [4, 5, 6], 'after', -2>>([1, 4, 5, 6, 2])
  assertType<InsertAtIndex<[1, 2], [4, 5, 6], 'after', 3>>([1, 2]) // out of bounds
  assertType<InsertAtIndex<[0, 2, 3], [1], 'after', 0>>([0, 1, 2, 3])
  assertType<InsertAtIndex<[], ['a'], 'after', 0>>(['a'])
  assertType<InsertAtIndex<[], ['a', 'b', 'c'], 'before', -1>>(['a', 'b', 'c'])
  assertType<InsertAtIndex<[], ['a', 'b', 'c'], 'after', -1>>(['a', 'b', 'c'])

  assertType<AdjustIndex<'after', 2>>(3)
  assertType<AdjustIndex<'before', -1>>(-1)

  assertType<NormalizeIndex<2, 2>>(2)
  assertType<NormalizeIndex<0, -2>>(0)
  assertType<NormalizeIndex<-1, 0>>(0)

  assertType<SplitAtPos<[], 1, 'after'>>([[], []])
  assertType<SplitAtPos<['a'], 1, 'after'>>([['a'], []])
  assertType<SplitAtPos<['a', 'b', 'c'], 2, 'after'>>([['a', 'b', 'c'], []])
})

test('applyOp function typings', () => {
  assertType<SetOp<4>>(set(4))
  assertType<4>(applyOp(inc(2), 2))

  //@ts-expect-error - Should be 4
  assertType<3>(applyOp(inc(2), 2))
  assertType<0>(applyOp(dec(2), 2))

  //@ts-expect-error - Should be 0
  assertType<1>(applyOp(dec(2), 2))
  assertType<{foo: 'bar'}>(applyOp(set({foo: 'bar'}), 2))
  assertType<'new'>(applyOp(set('new'), 'current'))
  assertType<{foo: 'bar'}>(applyOp(set({foo: 'bar'}), undefined))
  assertType<undefined>(applyOp(unset(), 'foo'))

  assertType<'current'>(applyOp(setIfMissing('new'), 'current'))
  assertType<'new'>(applyOp(setIfMissing('new'), undefined))

  // Assign
  assertType(
    <{foo: 'bar'; bar: 'ok'}>applyOp(assign({foo: 'bar'}), {bar: 'ok'}),
  )
  //@ts-expect-error can not assign to strings
  applyOp(assign({foo: 'bar'}), 'nah')

  //@ts-expect-error can not assign to numbers
  applyOp(assign({foo: 'bar'}), 2)

  //@ts-expect-error - Cannot assign to arrays
  applyOp(assign({foo: 'bar'}), ['foo'])

  //@ts-expect-error - Cannot assign to booleans
  applyOp(assign({foo: 'bar'}), true)

  // Unassign

  assertType<Record<never, never>>(applyOp(unassign(['foo']), {foo: 'ok'}))
  assertType<{bar: 'bar'}>(applyOp(unassign(['foo']), {bar: 'bar'}))
  //@ts-expect-error cannot unassign to string
  applyOp(unassign(['foo']), 'nah')

  //@ts-expect-error cannot unassign to arrays
  applyOp(unassign(['foo']), [])

  //@ts-expect-error can not unassign to numbers
  applyOp(unassign(['foo']), 2)

  //@ts-expect-error - Cannot unassign to arrays
  applyOp(unassign(['foo']), ['foo'])

  //@ts-expect-error - Cannot assign to booleans
  applyOp(unassign(['foo']), true)
})

test('The ApplyOp type', () => {
  test('ApplyOp types', () => {
    expectTypeOf<ApplyOp<SetOp<'new'>, 'old'>>().toEqualTypeOf<'new'>()
    expectTypeOf<ApplyOp<SetIfMissingOp<'new'>, 'old'>>().toEqualTypeOf<'old'>()

    expectTypeOf<
      ApplyOp<SetIfMissingOp<'new'>, undefined>
    >().toEqualTypeOf<'new'>()

    expectTypeOf<ApplyOp<UnsetOp, 'something'>>().toEqualTypeOf<undefined>()

    expectTypeOf<ApplyOp<IncOp<2>, 2>>().toEqualTypeOf<4>()

    expectTypeOf<ApplyOp<IncOp<99>, 1>>().toEqualTypeOf<100>()

    expectTypeOf<ApplyOp<DecOp<2>, 8>>().toEqualTypeOf<6>()

    expectTypeOf<IncOp<1>>().toEqualTypeOf<{type: 'inc'; amount: 1}>()

    type S = ApplyOp<InsertOp<[0], 'before', 0>, [1, 2, 3]>
    expectTypeOf<
      ApplyOp<InsertOp<[0], 'before', 0>, [1, 2, 3]>
    >().toEqualTypeOf<[0, 1, 2, 3]>()

    expectTypeOf<ApplyOp<InsertOp<[1], 'after', 0>, [0, 2, 3]>>().toEqualTypeOf<
      [0, 1, 2, 3]
    >()

    expectTypeOf<ApplyOp<ReplaceOp<[0], 1>, [1, 2, 3]>>().toEqualTypeOf<
      (0 | 1 | 2 | 3)[]
    >()

    expectTypeOf<
      ApplyOp<AssignOp<{foo: 'bar'}>, {bar: 'baz'}>
    >().toEqualTypeOf<{
      foo: 'bar'
      bar: 'baz'
    }>()

    expectTypeOf<
      ApplyOp<UnassignOp<['foo']>, {foo: 'remove'; bar: 'baz'}>
    >().toEqualTypeOf<{bar: 'baz'}>()
  })
})
