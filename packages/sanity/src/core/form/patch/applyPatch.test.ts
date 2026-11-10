import {makePatches, stringifyPatches} from '@sanity/diff-match-patch'
import {describe, expect, test} from 'vitest'

import {applyAll} from './applyPatch'
import {
  dec,
  diffMatchPatch,
  inc,
  insert,
  SANITY_PATCH_TYPE,
  set,
  setIfMissing,
  unset,
} from './patch'
import {type FormPatch} from './types'

function dmp(from: string, to: string) {
  return stringifyPatches(makePatches(from, to))
}

describe('applyAll', () => {
  test('returns the original value when there are no patches', () => {
    const value = {title: 'Hello'}
    expect(applyAll(value, [])).toBe(value)
  })

  test('applies patches in order', () => {
    expect(applyAll({count: 1, title: 'a'}, [set(2, ['count']), set('b', ['title'])])).toEqual({
      count: 2,
      title: 'b',
    })
  })

  test('does not mutate the original object or array', () => {
    const object = {title: 'Hello', tags: ['a']}
    const array = [{_key: 'a', title: 'Hello'}]

    applyAll(object, [set('Goodbye', ['title'])])
    applyAll(array, [set('Goodbye', [{_key: 'a'}, 'title'])])

    expect(object).toEqual({title: 'Hello', tags: ['a']})
    expect(array).toEqual([{_key: 'a', title: 'Hello'}])
  })
})

describe('object patches', () => {
  test('set replaces a nested field and leaves siblings', () => {
    expect(applyAll({title: 'Hello', count: 1}, [set('Goodbye', ['title'])])).toEqual({
      title: 'Goodbye',
      count: 1,
    })
  })

  test('set at the root replaces the whole object', () => {
    expect(applyAll({title: 'Hello'}, [set({title: 'Goodbye', count: 2})])).toEqual({
      title: 'Goodbye',
      count: 2,
    })
  })

  test('set at the root rejects a non-object value', () => {
    expect(() => applyAll({title: 'Hello'}, [set('nope')])).toThrow(
      'Cannot set value of an object to a non-object',
    )
  })

  test('unset removes a field and is a no-op for a missing field', () => {
    expect(applyAll({title: 'Hello', count: 1}, [unset(['title'])])).toEqual({count: 1})
    expect(applyAll({count: 1}, [unset(['title'])])).toEqual({count: 1})
  })

  test('unset at the root yields undefined', () => {
    expect(applyAll({title: 'Hello'}, [unset()])).toBeUndefined()
  })

  test('setIfMissing fills an absent field and leaves an existing one', () => {
    expect(applyAll({}, [setIfMissing('Hello', ['title'])])).toEqual({title: 'Hello'})
    expect(applyAll({title: 'Hello'}, [setIfMissing('Goodbye', ['title'])])).toEqual({
      title: 'Hello',
    })
  })

  test('setIfMissing at the root only fills undefined', () => {
    expect(applyAll(undefined, [setIfMissing({title: 'Hello'})])).toEqual({title: 'Hello'})
    expect(applyAll({title: 'Hello'}, [setIfMissing({title: 'Goodbye'})])).toEqual({title: 'Hello'})
  })

  test('rejects an unknown operation at the root', () => {
    expect(() => applyAll({title: 'Hello'}, [insert(['x'], 'after')])).toThrow(
      'Invalid object operation: insert',
    )
  })

  test('rejects a non-string field name in the path', () => {
    expect(() => applyAll({title: 'Hello'}, [set('x', [0])])).toThrow(
      'Expected field name to be a string, instead got: 0',
    )
  })
})

describe('array patches', () => {
  test('set at the root replaces the array', () => {
    expect(applyAll(['a'], [set(['b', 'c'])])).toEqual(['b', 'c'])
  })

  test('set at the root rejects a non-array value', () => {
    expect(() => applyAll(['a'], [set({title: 'Hello'})])).toThrow(
      'Cannot set value of an array to a non-array',
    )
  })

  test('unset at the root yields undefined', () => {
    expect(applyAll(['a'], [unset()])).toBeUndefined()
  })

  test('unset by index removes that item', () => {
    expect(applyAll(['a', 'b', 'c'], [unset([1])])).toEqual(['a', 'c'])
  })

  test('unset by object selector removes the matching item', () => {
    expect(
      applyAll(
        [
          {_key: 'a', title: 'A'},
          {_key: 'b', title: 'B'},
        ],
        [unset([{_key: 'b'}])],
      ),
    ).toEqual([{_key: 'a', title: 'A'}])
  })

  test('a selector that matches nothing is a no-op', () => {
    const value = [{_key: 'a', title: 'A'}]
    expect(applyAll(value, [unset([{_key: 'missing'}])])).toEqual(value)
    expect(applyAll(value, [set('X', [{_key: 'missing'}, 'title'])])).toEqual(value)
  })

  test('set by index replaces a primitive item', () => {
    expect(applyAll(['a', 'b'], [set('c', [1])])).toEqual(['a', 'c'])
  })

  test('set by key selector replaces a nested field on the matched item', () => {
    expect(
      applyAll(
        [
          {_key: 'a', title: 'A'},
          {_key: 'b', title: 'B'},
        ],
        [set('Bee', [{_key: 'b'}, 'title'])],
      ),
    ).toEqual([
      {_key: 'a', title: 'A'},
      {_key: 'b', title: 'Bee'},
    ])
  })

  test('insert after an index splices items in after that index', () => {
    expect(applyAll(['a', 'c'], [insert(['b'], 'after', [0])])).toEqual(['a', 'b', 'c'])
  })

  test('insert before an index splices items in at that index', () => {
    expect(applyAll(['a', 'c'], [insert(['b'], 'before', [1])])).toEqual(['a', 'b', 'c'])
  })

  test('insert after a key selector appends after the matched item', () => {
    expect(
      applyAll([{_key: 'a'}, {_key: 'c'}], [insert([{_key: 'b'}], 'after', [{_key: 'a'}])]),
    ).toEqual([{_key: 'a'}, {_key: 'b'}, {_key: 'c'}])
  })

  test('insert into an empty array ignores the index and returns the items', () => {
    expect(applyAll([], [insert(['a', 'b'], 'after', [99])])).toEqual(['a', 'b'])
  })

  test('insert wraps an out-of-range index instead of appending', () => {
    expect(applyAll(['a', 'b', 'c'], [insert(['x'], 'before', [100])])).toEqual([
      'a',
      'x',
      'b',
      'c',
    ])
  })

  test('insert rejects a position other than before or after', () => {
    const patch = {
      patchType: SANITY_PATCH_TYPE,
      type: 'insert',
      path: [0],
      position: 'inside',
      items: ['x'],
    } as unknown as FormPatch

    expect(() => applyAll(['a'], [patch])).toThrow(
      'Invalid position "inside", must be either before or after',
    )
  })

  test('move relocates an item from one index to another', () => {
    const patch = {
      patchType: SANITY_PATCH_TYPE,
      type: 'move',
      path: [],
      value: {from: 0, to: 2},
    } as unknown as FormPatch

    expect(applyAll(['a', 'b', 'c'], [patch])).toEqual(['b', 'c', 'a'])
  })

  test('move rejects a value without from and to', () => {
    const patch = {
      patchType: SANITY_PATCH_TYPE,
      type: 'move',
      path: [],
      value: {from: 0},
    } as unknown as FormPatch

    expect(() => applyAll(['a', 'b'], [patch])).toThrow(
      'Invalid value of \'move\' patch. Expected a value with "from" and "to" indexes, instead got: {"from":0}',
    )
  })

  test('rejects an unknown operation at the root', () => {
    expect(() => applyAll(['a'], [diffMatchPatch(dmp('a', 'b'))])).toThrow(
      'Invalid array operation: diffMatchPatch',
    )
  })
})

describe('string and primitive patches', () => {
  test('set replaces a string', () => {
    expect(applyAll('hello', [set('goodbye')])).toBe('goodbye')
  })

  test('setIfMissing leaves an existing string', () => {
    expect(applyAll('hello', [setIfMissing('goodbye')])).toBe('hello')
  })

  test('unset on a string yields undefined', () => {
    expect(applyAll('hello', [unset()])).toBeUndefined()
  })

  test('diffMatchPatch applies a string diff', () => {
    expect(applyAll('hello', [diffMatchPatch(dmp('hello', 'hello world'))])).toBe('hello world')
  })

  test('diffMatchPatch applies a change near the end of a long string', () => {
    const source =
      'This string has changes, but they occur somewhere near the end. That means we need to use an offset to get at the change, we cannot just rely on equality segaments in the generated diff.'
    const target =
      'This string has changes, but they occur somewhere near the end. That means we need to use an offset to get at the change, we cannot just rely on equality segments in the generated diff.'

    expect(applyAll(source, [diffMatchPatch(dmp(source, target))])).toBe(target)
  })

  test('rejects a deep path on a string', () => {
    expect(() => applyAll('hello', [set('x', ['nope'])])).toThrow(
      'Cannot apply deep operations on string values',
    )
  })

  test('rejects an unsupported operation on a string', () => {
    expect(() => applyAll('hello', [insert(['x'], 'after')])).toThrow(
      /Received patch of unsupported type: .*insert.* for string/,
    )
  })

  test('quotes an unsupported string patch type once in the error message', () => {
    expect(() => applyAll('hello', [insert(['x'], 'after')])).toThrow(
      'Received patch of unsupported type: "insert" for string. This is most likely a bug.',
    )
  })

  test('inc and dec change a number at a field path', () => {
    expect(applyAll({count: 5}, [inc(2, ['count']) as unknown as FormPatch])).toEqual({count: 7})
    expect(applyAll({count: 5}, [dec(2, ['count']) as unknown as FormPatch])).toEqual({count: 3})
  })

  test('setIfMissing fills undefined through a nested path', () => {
    expect(applyAll({meta: {}}, [setIfMissing('en', ['meta', 'lang'])])).toEqual({
      meta: {lang: 'en'},
    })
  })

  test('a deep patch on a missing value throws rather than creating containers', () => {
    expect(() => applyAll({}, [unset(['items', 0])])).toThrow(
      'Cannot apply deep operations on primitive values',
    )
  })

  test('rejects an unsupported operation on a primitive', () => {
    expect(() => applyAll(3, [insert(['x'], 'after')])).toThrow(
      'Received patch of unsupported type "insert" for primitives',
    )
  })
})
