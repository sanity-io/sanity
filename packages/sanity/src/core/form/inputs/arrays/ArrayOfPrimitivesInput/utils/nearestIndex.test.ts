import {nearestIndexOf} from './nearestIndex'

test('nearestIndexOf', () => {
  expect(nearestIndexOf(['a', 'b', 'b', 'c', 'a'], 0, 'a')).toBe(0)
  expect(nearestIndexOf(['a', 'b', 'b', 'c', 'a'], 1, 'a')).toBe(0)

  // it prefers the nearest match from the first half if there's a tie
  expect(nearestIndexOf(['a', 'b', 'b', 'c', 'a'], 2, 'a')).toBe(0)

  expect(nearestIndexOf(['a', 'b', 'b', 'c', 'a'], 3, 'a')).toBe(4)
  expect(nearestIndexOf(['a', 'b', 'b', 'c', 'a'], 4, 'a')).toBe(4)
})

test('nearestIndexOf with no matches', () => {
  expect(nearestIndexOf(['a', 'b', 'b', 'c', 'a'], 0, 'x')).toBe(-1)
  expect(nearestIndexOf(['a', 'b', 'b', 'c', 'a'], 1, 'x')).toBe(-1)
  expect(nearestIndexOf(['a', 'b', 'b', 'c', 'a'], 2, 'x')).toBe(-1)
  expect(nearestIndexOf(['a', 'b', 'b', 'c', 'a'], 3, 'x')).toBe(-1)
  expect(nearestIndexOf(['a', 'b', 'b', 'c', 'a'], 4, 'x')).toBe(-1)
})
