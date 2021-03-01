/* eslint-disable max-nested-callbacks, @typescript-eslint/ban-ts-comment */
import {test} from 'tap'
import {fromString, toString, get} from '../src/pathUtils'

const srcObject = {
  title: 'Hei',
  nested: {'0': 'Zero-Key'},
  nullVal: null,
  body: [
    {_key: 'foo', title: 'Foo'},
    {_key: 'bar', children: [{_key: 'child1', text: 'Heisann'}]},
  ],
  multiDimensional: [
    [[{_key: 'abc', title: 'hai'}], [{_key: 'def', title: 'def'}]],
    [
      [13, 14],
      [15, 16],
    ],
  ],
}

test('fromString: throws if not a string', (t) => {
  // @ts-ignore
  t.throws(() => fromString(), 'Path is not a string')
  // @ts-ignore
  t.throws(() => fromString(13), 'Path is not a string')
  // @ts-ignore
  t.throws(() => fromString(null), 'Path is not a string')
  // @ts-ignore
  t.throws(() => fromString(false), 'Path is not a string')
  t.end()
})

test('fromString: handles plain property segments', (t) => {
  t.strictDeepEqual(fromString('foo'), ['foo'])
  t.end()
})

test('fromString: handles index segments', (t) => {
  t.strictDeepEqual(fromString('[0]'), [0])
  t.strictDeepEqual(fromString('[1337]'), [1337])
  t.end()
})

test('fromString: handles key segments', (t) => {
  t.strictDeepEqual(fromString('[_key == "foo"]'), [{_key: 'foo'}])
  t.strictDeepEqual(fromString("[ _key== 'B4z']"), [{_key: 'B4z'}])
  t.strictDeepEqual(fromString('[_key=="bar"]'), [{_key: 'bar'}])
  t.end()
})

test('fromString: handles deep prop segments', (t) => {
  t.strictDeepEqual(fromString('foo.bar'), ['foo', 'bar'])
  t.strictDeepEqual(fromString('bar.foo'), ['bar', 'foo'])
  t.strictDeepEqual(fromString('bar.foo.baz'), ['bar', 'foo', 'baz'])
  t.end()
})

test('fromString: handles deep array index segments', (t) => {
  t.strictDeepEqual(fromString('foo[13]'), ['foo', 13])
  t.strictDeepEqual(fromString('bar.foo[3]'), ['bar', 'foo', 3])
  t.strictDeepEqual(fromString('[3][18]'), [3, 18])
  t.end()
})

test('fromString: handles deep key segments', (t) => {
  t.strictDeepEqual(fromString('foo[_key=="bar"].body[_key=="13ch"'), [
    'foo',
    {_key: 'bar'},
    'body',
    {_key: '13ch'},
  ])
  t.strictDeepEqual(fromString('bar.foo[3][_key == "seg"]'), ['bar', 'foo', 3, {_key: 'seg'}])
  t.strictDeepEqual(fromString('[_key=="foo"][_key== "bar"][_key =="baz"][  _key   == "seg"  '), [
    {_key: 'foo'},
    {_key: 'bar'},
    {_key: 'baz'},
    {_key: 'seg'},
  ])
  t.end()
})

test('toString: throws if not an array', (t) => {
  // @ts-ignore
  t.throws(() => toString(), 'Path is not an array')
  // @ts-ignore
  t.throws(() => toString(13), 'Path is not an array')
  // @ts-ignore
  t.throws(() => toString(null), 'Path is not an array')
  // @ts-ignore
  t.throws(() => toString(false), 'Path is not an array')
  t.end()
})

test('toString: handles plain property segments', (t) => {
  t.strictDeepEqual(toString(['foo']), 'foo')
  t.end()
})

test('toString: handles index segments', (t) => {
  t.strictDeepEqual(toString([0]), '[0]')
  t.strictDeepEqual(toString([1337]), '[1337]')
  t.end()
})

test('toString: handles key segments', (t) => {
  t.strictDeepEqual(toString([{_key: 'foo'}]), '[_key=="foo"]')
  t.strictDeepEqual(toString([{_key: 'B4z'}]), '[_key=="B4z"]')
  t.strictDeepEqual(toString([{_key: 'bar'}]), '[_key=="bar"]')
  t.end()
})

test('toString: handles deep prop segments', (t) => {
  t.strictDeepEqual(toString(['foo', 'bar']), 'foo.bar')
  t.strictDeepEqual(toString(['bar', 'foo']), 'bar.foo')
  t.strictDeepEqual(toString(['bar', 'foo', 'baz']), 'bar.foo.baz')
  t.end()
})

test('toString: handles deep array index segments', (t) => {
  t.strictDeepEqual(toString(['foo', 13]), 'foo[13]')
  t.strictDeepEqual(toString(['bar', 'foo', 3]), 'bar.foo[3]')
  t.strictDeepEqual(toString([3, 18]), '[3][18]')
  t.end()
})

test('toString: handles deep key segments', (t) => {
  t.strictDeepEqual(
    toString(['foo', {_key: 'bar'}, 'body', {_key: '13ch'}]),
    'foo[_key=="bar"].body[_key=="13ch"]'
  )
  t.strictDeepEqual(toString(['bar', 'foo', 3, {_key: 'seg'}]), 'bar.foo[3][_key=="seg"]')
  t.strictDeepEqual(
    toString([{_key: 'foo'}, {_key: 'bar'}, {_key: 'baz'}, {_key: 'seg'}]),
    '[_key=="foo"][_key=="bar"][_key=="baz"][_key=="seg"]'
  )
  t.end()
})

test('toString: throws on unrecognized segment types', (t) => {
  // @ts-ignore
  t.throws(() => toString([{foo: 'bar'}]), 'Unsupported path segment `{"foo":"bar"}`')
  t.end()
})

test('get: throws on non-array/non-string path', (t) => {
  // @ts-ignore
  t.throws(() => get(srcObject, null), 'Path must be an array or a string')
  // @ts-ignore
  t.throws(() => get(srcObject, 13), 'Path must be an array or a string')

  // @ts-ignore
  t.throws(() => get(srcObject, false), 'Path must be an array or a string')
  // @ts-ignore
  t.throws(() => get(srcObject, true), 'Path must be an array or a string')
  t.end()
})

test('get: can get simple props', (t) => {
  t.strictDeepEqual(get(srcObject, 'title'), srcObject.title)
  t.strictDeepEqual(get(srcObject, ['title']), srcObject.title)
  t.end()
})

test('get: can pass default value', (t) => {
  const defaultVal = Math.random()
  t.strictDeepEqual(get(srcObject, 'notSet', defaultVal), defaultVal)
  t.strictDeepEqual(get(srcObject, ['notSet'], defaultVal), defaultVal)
  t.end()
})

test('get: can use array indexes', (t) => {
  t.strictDeepEqual(get(srcObject, ['body', 0]), srcObject.body[0])
  t.strictDeepEqual(get(srcObject, ['body', 1, 'children', 0]), srcObject.body[1].children![0])
  t.strictDeepEqual(get(srcObject, ['multiDimensional', 1, 1]), srcObject.multiDimensional[1][1])
  t.end()
})

test('get: can use key lookup', (t) => {
  t.strictDeepEqual(get(srcObject, ['body', {_key: 'bar'}]), srcObject.body[1])
  t.strictDeepEqual(
    get(srcObject, ['body', {_key: 'bar'}, 'children', {_key: 'child1'}]),
    srcObject.body[1].children![0]
  )
  t.end()
})

test('get: falls back to default value on array index at non-array', (t) => {
  const defaultVal = {}
  t.strictDeepEqual(get(srcObject, ['title', 1], defaultVal), defaultVal)
  t.end()
})

test('get: falls back to default value on property lookup at non-object', (t) => {
  const defaultVal = {}
  t.strictDeepEqual(get(srcObject, ['title', 'bar'], defaultVal), defaultVal)
  t.strictDeepEqual(get(srcObject, ['multiDimensional', 'bar'], defaultVal), defaultVal)
  t.strictDeepEqual(get(srcObject, ['nullVal', 'bar'], defaultVal), defaultVal)
  t.end()
})

test('get: falls back to default value on key lookup at non-array', (t) => {
  const defaultVal = {}
  t.strictDeepEqual(get(srcObject, ['nullVal', {_key: 'abc'}], defaultVal), defaultVal)
  t.end()
})

test('get: can get numbered key from object', (t) => {
  t.strictDeepEqual(get(srcObject, 'nested.0'), 'Zero-Key')
  t.strictDeepEqual(get(srcObject, ['nested', '0']), 'Zero-Key')
  t.end()
})
