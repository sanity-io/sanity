// Converts an array of simple values (strings, numbers only) to a jsonmatch path string.

import {test} from 'tap'
import arrayToJSONMatchPath from '../src/jsonpath/arrayToJSONMatchPath'
import {Path} from '../../util/src/typedefs/path'

const cases: Array<[any, string]> = [
  [['a', 'b', 'c'], 'a.b.c'],
  [['a', 'b', 5], 'a.b[5]'],
  [[1, 2, 3], '[1][2][3]'],
  [[1, 'foo', 'bar', 4], '[1].foo.bar[4]'],
  [[1, '-foo', 'bar', 4], "[1]['-foo'].bar[4]"],
  [[1, {foo: 'bar'}, 4], '[1][foo=="bar"][4]'],
  [[1, {foo: 'bar', bar: 'baz'}, 4], '[1][foo=="bar"][bar=="baz"][4]'] // future maybe:
  // [[1, [{foo: 'bar'}, {bar: 'baz'}], 4], "[1][foo=='bar'||bar=='baz'][4]"]
  // [[1, {foo: 'bar', bar: 'baz'}, 4], "[1][foo=='bar'&&bar=='baz'][4]"]
]

test(tap => {
  cases.forEach(([input, expected]) => {
    tap.same(arrayToJSONMatchPath(input), expected)
  })
  tap.end()
})
