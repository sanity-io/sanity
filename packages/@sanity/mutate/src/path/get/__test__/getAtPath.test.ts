import {expect, test} from 'vitest'

import {getAtPath} from '../getAtPath'

test('deepGet() function', () => {
  const testDoc = {
    title: 'Example',
    items: [
      {_key: 'a', letters: ['a', 'b', 'c']},
      {_key: 'b', letters: ['a', 'b', 'c']},
      {_key: 'c', letters: ['x', 'y', 'z']},
      {_key: 'd', letters: ['a', 'b', 'c']},
    ],
  } as const

  expect(getAtPath([], testDoc)).toBe(testDoc)

  expect(getAtPath(['items'], testDoc)).toEqual(testDoc.items)

  expect(getAtPath(['nonexistent'], testDoc)).toEqual(undefined)

  expect(getAtPath(['items', 3, 'letters', 2], testDoc)).toEqual('c')

  expect(getAtPath([1], testDoc.items)).toEqual(testDoc.items[1])

  expect(getAtPath(['items', 2, 'letters', 2], testDoc)).toEqual(
    testDoc.items[2].letters[2],
  )

  expect(getAtPath(['items', {_key: 'b'}, 'letters', 2], testDoc)).toEqual(
    testDoc.items[1].letters[2],
  )

  const literal = {
    title: 'hello',
    items: [
      {_key: 'a', letters: ['a', 'b', 'c']},
      {_key: 'b', letters: ['a', 'b', 'c']},
      {_key: 'c', letters: ['x', 'y', 'z']},
      {_key: 'd', letters: ['a', 'b', 'c']},
    ],
  }

  expect(getAtPath(['items', 2, 'letters', 2], literal)).toEqual(
    literal.items[2].letters[2],
  )
})
