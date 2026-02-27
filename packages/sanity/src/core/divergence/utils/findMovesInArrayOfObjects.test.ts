import {lastValueFrom} from 'rxjs'
import {expect, test} from 'vitest'

import {findMovesInArrayOfObjects} from './findMovesInArrayOfObjects'
import {keyArray} from './keyArray'

const cases: [a: string[], b: string[], expected: unknown][] = [
  [
    ['a', 'b'],
    ['b', 'a'],
    {
      a: 1,
    },
  ],
  [
    ['a', 'b', 'c', 'd'],
    ['d', 'a', 'b', 'c'],
    {
      d: -3,
    },
  ],
  [
    ['a', 'b', 'c', 'd'],
    ['b', 'c', 'd', 'a'],
    {
      a: 3,
    },
  ],
  [
    ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'],
    ['d', 'a', 'b', 'c', 'h', 'e', 'f', 'g'],
    {
      d: -3,
      h: -3,
    },
  ],
  [
    ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'],
    ['b', 'c', 'd', 'a', 'f', 'g', 'h', 'e'],
    {
      a: 3,
      e: 3,
    },
  ],
  [
    ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'],
    ['d', 'a', 'b', 'h', 'i', 'f', 'g'],
    {
      d: -2,
      h: -2,
    },
  ],
  [
    ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'],
    ['d', 'b', 'h', 'i', 'f', 'g', 'a'],
    {
      a: 5,
      d: -2,
      h: -3,
    },
  ],
  [['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'], ['a', 'b', 'g', 'h'], {}],
  [
    ['a', 'b', 'c'],
    ['b', 'c', 'a'],
    {
      a: 2,
    },
  ],
  [
    ['a', 'c', 'b'],
    ['b', 'c', 'a'],
    {
      a: 2,
      b: -2,
    },
  ],
]

test.concurrent.for(cases)('%j to %j is %j', async ([a, b, expected]) => {
  const output = await lastValueFrom(findMovesInArrayOfObjects(keyArray(...a), keyArray(...b)))
  expect(output).toEqual(expected)
})
