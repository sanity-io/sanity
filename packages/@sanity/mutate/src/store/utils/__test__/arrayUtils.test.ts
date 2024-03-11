import {describe, expect, test} from 'vitest'

import {takeUntil, takeUntilRight} from '../arrayUtils'

describe('takeUntil', () => {
  test('inclusive', () => {
    expect(takeUntil([], x => x === 3, {inclusive: true})).toEqual([])
    expect(takeUntil([1], x => x === 3, {inclusive: true})).toEqual([1])
    expect(takeUntil([0, 3], x => x === 3, {inclusive: true})).toEqual([0, 3])
    expect(takeUntil([1, 2, 3, 4, 5], x => x === 3, {inclusive: true})).toEqual(
      [1, 2, 3],
    )
  })
  test('exclusive', () => {
    expect(takeUntil([], x => x === 3, {inclusive: false})).toEqual([])
    expect(takeUntil([1], x => x === 3, {inclusive: false})).toEqual([1])
    expect(takeUntil([0, 3], x => x === 3, {inclusive: false})).toEqual([0])

    expect(takeUntil([1, 2, 3, 4, 5], x => x === 3)).toEqual([1, 2])
  })
})

describe('takeUntilRight', () => {
  test('inclusive', () => {
    expect(takeUntilRight([], x => x === 3, {inclusive: true})).toEqual([])
    expect(takeUntilRight([1], x => x === 3, {inclusive: true})).toEqual([1])
    expect(takeUntilRight([0, 3], x => x === 3, {inclusive: true})).toEqual([3])
    expect(
      takeUntilRight([1, 2, 3, 4, 5], x => x === 3, {inclusive: true}),
    ).toEqual([5, 4, 3])
  })
  test('exclusive', () => {
    expect(takeUntilRight([], x => x === 3, {inclusive: false})).toEqual([])
    expect(takeUntilRight([1], x => x === 3, {inclusive: false})).toEqual([1])
    expect(takeUntilRight([0, 3], x => x === 3, {inclusive: false})).toEqual([])
    expect(
      takeUntilRight([1, 2, 3, 4, 5], x => x === 3, {inclusive: false}),
    ).toEqual([5, 4])
  })
})
