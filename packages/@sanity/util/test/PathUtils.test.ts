/* eslint-disable max-nested-callbacks, @typescript-eslint/ban-ts-comment */
import {fromString, toString, get, resolveKeyedPath} from '../src/paths'

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

test('fromString: throws if not a string', () => {
  // @ts-expect-error
  expect(() => fromString()).toThrow('Path is not a string')
  // @ts-expect-error
  expect(() => fromString(13)).toThrow('Path is not a string')

  expect(() => fromString(null as any)).toThrow('Path is not a string')
  // @ts-expect-error
  expect(() => fromString(false)).toThrow('Path is not a string')
})

test('fromString: handles plain property segments', () => {
  expect(fromString('foo')).toEqual(['foo'])
})

test('fromString: handles index segments', () => {
  expect(fromString('[0]')).toEqual([0])
  expect(fromString('[1337]')).toEqual([1337])
})

test('fromString: handles key segments', () => {
  expect(fromString('[_key == "foo"]')).toEqual([{_key: 'foo'}])
  expect(fromString("[ _key== 'B4z']")).toEqual([{_key: 'B4z'}])
  expect(fromString('[_key=="bar"]')).toEqual([{_key: 'bar'}])
})

test('fromString: handles deep prop segments', () => {
  expect(fromString('foo.bar')).toEqual(['foo', 'bar'])
  expect(fromString('bar.foo')).toEqual(['bar', 'foo'])
  expect(fromString('bar.foo.baz')).toEqual(['bar', 'foo', 'baz'])
})

test('fromString: handles deep array index segments', () => {
  expect(fromString('foo[13]')).toEqual(['foo', 13])
  expect(fromString('bar.foo[3]')).toEqual(['bar', 'foo', 3])
  expect(fromString('[3][18]')).toEqual([3, 18])
})

test('fromString: handles deep key segments', () => {
  expect(fromString('foo[_key=="bar"].body[_key=="13ch"')).toEqual([
    'foo',
    {_key: 'bar'},
    'body',
    {_key: '13ch'},
  ])
  expect(fromString('bar.foo[3][_key == "seg"]')).toEqual(['bar', 'foo', 3, {_key: 'seg'}])
  expect(fromString('[_key=="foo"][_key== "bar"][_key =="baz"][  _key   == "seg"  ')).toEqual([
    {_key: 'foo'},
    {_key: 'bar'},
    {_key: 'baz'},
    {_key: 'seg'},
  ])
})

test('toString: throws if not an array', () => {
  // @ts-expect-error
  expect(() => toString()).toThrow('Path is not an array')

  expect(() => toString(13 as any)).toThrow('Path is not an array')

  expect(() => toString(null as any)).toThrow('Path is not an array')
  expect(() => toString(false as any)).toThrow('Path is not an array')
})

test('toString: handles plain property segments', () => {
  expect(toString(['foo'])).toEqual('foo')
})

test('toString: handles index segments', () => {
  expect(toString([0])).toEqual('[0]')
  expect(toString([1337])).toEqual('[1337]')
})

test('toString: handles key segments', () => {
  expect(toString([{_key: 'foo'}])).toEqual('[_key=="foo"]')
  expect(toString([{_key: 'B4z'}])).toEqual('[_key=="B4z"]')
  expect(toString([{_key: 'bar'}])).toEqual('[_key=="bar"]')
})

test('toString: handles deep prop segments', () => {
  expect(toString(['foo', 'bar'])).toEqual('foo.bar')
  expect(toString(['bar', 'foo'])).toEqual('bar.foo')
  expect(toString(['bar', 'foo', 'baz'])).toEqual('bar.foo.baz')
})

test('toString: handles deep array index segments', () => {
  expect(toString(['foo', 13])).toEqual('foo[13]')
  expect(toString(['bar', 'foo', 3])).toEqual('bar.foo[3]')
  expect(toString([3, 18])).toEqual('[3][18]')
})

test('toString: handles deep key segments', () => {
  expect(toString(['foo', {_key: 'bar'}, 'body', {_key: '13ch'}])).toEqual(
    'foo[_key=="bar"].body[_key=="13ch"]',
  )
  expect(toString(['bar', 'foo', 3, {_key: 'seg'}])).toEqual('bar.foo[3][_key=="seg"]')
  expect(toString([{_key: 'foo'}, {_key: 'bar'}, {_key: 'baz'}, {_key: 'seg'}])).toEqual(
    '[_key=="foo"][_key=="bar"][_key=="baz"][_key=="seg"]',
  )
})

test('toString: throws on unrecognized segment types', () => {
  expect(() => toString([{foo: 'bar'} as any])).toThrow('Unsupported path segment `{"foo":"bar"}`')
})

test('get: throws on non-array/non-string path', () => {
  expect(() => get(srcObject, null as any)).toThrow('Path must be an array or a string')
  expect(() => get(srcObject, 13 as any)).toThrow('Path must be an array or a string')
  expect(() => get(srcObject, false as any)).toThrow('Path must be an array or a string')
  expect(() => get(srcObject, true as any)).toThrow('Path must be an array or a string')
})

test('get: can get simple props', () => {
  expect(get(srcObject, 'title')).toEqual(srcObject.title)
  expect(get(srcObject, ['title'])).toEqual(srcObject.title)
})

test('get: can pass default value', () => {
  const defaultVal = Math.random()
  expect(get(srcObject, 'notSet', defaultVal)).toEqual(defaultVal)
  expect(get(srcObject, ['notSet'], defaultVal)).toEqual(defaultVal)
})

test('get: can use array indexes', () => {
  expect(get(srcObject, ['body', 0])).toEqual(srcObject.body[0])
  expect(get(srcObject, ['body', 1, 'children', 0])).toEqual(srcObject.body[1].children![0])
  expect(get(srcObject, ['multiDimensional', 1, 1])).toEqual(srcObject.multiDimensional[1][1])
})

test('get: can use key lookup', () => {
  expect(get(srcObject, ['body', {_key: 'bar'}])).toEqual(srcObject.body[1])
  expect(get(srcObject, ['body', {_key: 'bar'}, 'children', {_key: 'child1'}])).toEqual(
    srcObject.body[1].children![0],
  )
})

test('get: falls back to default value on array index at non-array', () => {
  const defaultVal = {}
  expect(get(srcObject, ['title', 1], defaultVal)).toEqual(defaultVal)
})

test('get: falls back to default value on property lookup at non-object', () => {
  const defaultVal = {}
  expect(get(srcObject, ['title', 'bar'], defaultVal)).toEqual(defaultVal)
  expect(get(srcObject, ['multiDimensional', 'bar'], defaultVal)).toEqual(defaultVal)
  expect(get(srcObject, ['nullVal', 'bar'], defaultVal)).toEqual(defaultVal)
})

test('get: falls back to default value on key lookup at non-array', () => {
  const defaultVal = {}
  expect(get(srcObject, ['nullVal', {_key: 'abc'}], defaultVal)).toEqual(defaultVal)
})

test('get: can get numbered key from object', () => {
  expect(get(srcObject, 'nested.0')).toEqual('Zero-Key')
  expect(get(srcObject, ['nested', '0'])).toEqual('Zero-Key')
})

test('resolveKeyedPath: can resolve a keyed path from a path using only numeric indices', () => {
  expect(resolveKeyedPath({foo: 'bar'}, ['foo'])).toEqual(['foo'])
  // falls back to numeric index if item isn't keyed
  expect(resolveKeyedPath({arr: ['one', 'two']}, ['arr', 1])).toEqual(['arr', 1])
  expect(
    resolveKeyedPath(
      {
        arr: [
          {_key: 'a', text: 'first'},
          {_key: 'b', text: 'second'},
        ],
      },
      ['arr', 1],
    ),
  ).toEqual(['arr', {_key: 'b'}])

  // deeper
  expect(
    resolveKeyedPath(
      {
        arr: [
          {_key: 'a', text: 'first'},
          {_key: 'b', inner: {innerArr: [{_key: 'xyz', text: 'final'}]}},
        ],
      },
      ['arr', 1, 'inner', 'innerArr', 0, 'text'],
    ),
  ).toEqual(['arr', {_key: 'b'}, 'inner', 'innerArr', {_key: 'xyz'}, 'text']) // deeper

  // index 3 is out of bounds
  expect(
    resolveKeyedPath(
      {
        arr: [
          {_key: 'a', text: 'first'},
          {_key: 'b', text: 'second'},
        ],
      },
      ['arr', 3, 'this', 'does', 'not', 'exist'],
    ),
  ).toEqual(['arr'])

  // this is ok, since the array exist and is keyed - object paths are returned as-is
  expect(
    resolveKeyedPath(
      {
        arr: [
          {_key: 'a', text: 'first'},
          {_key: 'b', text: 'second'},
        ],
      },
      ['arr', 1, 'this', 'does', 'not', 'exist'],
    ),
  ).toEqual(['arr', {_key: 'b'}, 'this', 'does', 'not', 'exist'])
})
