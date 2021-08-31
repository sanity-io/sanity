// Converts an array of simple values (strings, numbers only) to a jsonmatch path string.

import arrayToJSONMatchPath from '../src/jsonpath/arrayToJSONMatchPath'

const cases: Array<[any, string]> = [
  [['a', 'b', 'c'], 'a.b.c'],
  [['a', 'b', 5], 'a.b[5]'],
  [[1, 2, 3], '[1][2][3]'],
  [[1, 'foo', 'bar', 4], '[1].foo.bar[4]'],
  [[1, '-foo', 'bar', 4], "[1]['-foo'].bar[4]"],
  [[1, {foo: 'bar'}, 4], '[1][foo=="bar"][4]'],
  [[1, {foo: 'bar', bar: 'baz'}, 4], '[1][foo=="bar"][bar=="baz"][4]'], // future maybe:
  // [[1, [{foo: 'bar'}, {bar: 'baz'}], 4], "[1][foo=='bar'||bar=='baz'][4]"]
  // [[1, {foo: 'bar', bar: 'baz'}, 4], "[1][foo=='bar'&&bar=='baz'][4]"]
]

describe('cases', () => {
  cases.forEach(([input, expected], i) => {
    test(`case #${i}`, () => {
      expect(arrayToJSONMatchPath(input)).toEqual(expected)
    })
  })
})
