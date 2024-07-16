import {expect, test} from '@jest/globals'

import {immutableReconcile} from '../immutableReconcile'

test('it preserves previous value if shallow equal', () => {
  const prev = {test: 'hi'}
  const next = {test: 'hi'}
  expect(immutableReconcile(prev, next)).toBe(prev)
})

test('it preserves previous value if deep equal', () => {
  const prev = {arr: [{foo: 'bar'}]}
  const next = {arr: [{foo: 'bar'}]}
  expect(immutableReconcile(prev, next)).toBe(prev)
})

test('it preserves previous nodes that are deep equal', () => {
  const prev = {arr: [{foo: 'bar'}], x: 1}
  const next = {arr: [{foo: 'bar'}]}
  expect(immutableReconcile(prev, next).arr).toBe(prev.arr)
})

test('it keeps equal objects in arrays', () => {
  const prev = {arr: ['foo', {greet: 'hello'}, {other: []}], x: 1}
  const next = {arr: ['bar', {greet: 'hello'}, {other: []}]}
  expect(immutableReconcile(prev, next).arr).not.toBe(prev.arr)
  expect(immutableReconcile(prev, next).arr[1]).toBe(prev.arr[1])
  expect(immutableReconcile(prev, next).arr[2]).toBe(prev.arr[2])
})

test('it handles changing cyclic structures', () => {
  const createObject = (differentiator: string) => {
    // will be different if differentiator is different
    const root: Record<string, any> = {id: 'root'}

    // will be different if differentiator is different
    root.a = {id: 'a'}

    // will be different if differentiator is different
    root.a.b = {id: 'b', diff: differentiator}

    // cycle
    root.a.b.a = root.a
    // will never be different
    root.a.b.c = {id: 'c'}

    return root
  }

  const prev = createObject('previous')
  const next = createObject('next')

  const reconciled = immutableReconcile(prev, next)

  expect(prev).not.toBe(reconciled)
  expect(next).not.toBe(reconciled)

  // A sub object of root has changed, creating new object
  expect(next.a).not.toBe(reconciled.a)

  // A sub-object of root.a has changed, creating new object
  expect(next.a.b).not.toBe(reconciled.a.b)

  // root.a.b.c is has not changed, therefore reuse.
  expect(next.a.b.c).not.toBe(reconciled.a.b.c)

  expect(prev.a.b.c).toBe(reconciled.a.b.c)

  // The new reconcile will retain reconcilable objects also within loops.
  expect(prev.a.b.a.b.c).toBe(reconciled.a.b.a.b.c)

  // This is because it retains the loop.
  expect(reconciled.a).toBe(reconciled.a.b.a)
  expect(prev.a.b.c).toBe(reconciled.a.b.a.b.c)
})

test('it handles non-changing cyclic structures', () => {
  const cyclic: Record<string, unknown> = {test: 'foo'}
  cyclic.self = cyclic

  const prev = {
    cyclic,
    arr: [
      {cyclic, value: 'old'},
      {cyclic, value: 'unchanged'},
    ],
    other: {cyclic, value: 'unchanged'},
  }
  const next = {
    cyclic,
    arr: [
      {cyclic, value: 'new'},
      {cyclic, value: 'unchanged'},
    ],
    other: {cyclic, value: 'unchanged'},
  }

  const reconciled = immutableReconcile(prev, next)
  expect(reconciled.arr).not.toBe(prev.arr)
  expect(reconciled.arr[1]).toBe(prev.arr[1])
  expect(reconciled.other).toBe(prev.other)
})

test('keeps the previous values where they deep equal to the next', () => {
  const prev = {
    test: 'hi',
    array: ['aloha', {foo: 'bar'}],
    object: {
      x: {y: 'CHANGE'},
      keep: {foo: 'bar'},
    },
  }
  const next = {
    test: 'hi',
    array: ['aloha', {foo: 'bar'}],
    object: {
      x: {y: 'CHANGED'},
      keep: {foo: 'bar'},
    },
    new: ['foo', 'bar'],
  }

  const result = immutableReconcile(prev, next)

  expect(result).not.toBe(prev)
  expect(result).not.toBe(next)

  expect(result.array).toBe(prev.array)
  expect(result.object.keep).toBe(prev.object.keep)
})

test('does not mutate any of its input', () => {
  const prev = Object.freeze({
    test: 'hi',
    array: ['aloha', {foo: 'bar'}],
    object: {
      x: {y: 'z'},
      keep: {foo: 'bar'},
    },
  })
  const next = Object.freeze({
    test: 'hi',
    array: ['aloha', {foo: 'bar'}],
    object: {x: {y: 'x'}, keep: {foo: 'bar'}},
    new: ['foo', 'bar'],
  })

  expect(() => immutableReconcile(prev, next)).not.toThrow()
})

test('returns new object when previous and next has different number of keys', () => {
  const moreKeys = {
    key1: 'value1',
    key2: 'value2',
    key3: 'value3',
  }
  const lessKeys = {
    key1: 'value1',
    key2: 'value2',
  }

  expect(immutableReconcile(moreKeys, lessKeys)).not.toBe(moreKeys)
  expect(immutableReconcile(lessKeys, moreKeys)).not.toBe(lessKeys)
})

test('returns new array when previous and next has different length', () => {
  const moreItems = ['a', 'b']
  const lessItems = ['a']

  expect(immutableReconcile(moreItems, lessItems)).not.toBe(moreItems)

  expect(immutableReconcile(lessItems, moreItems)).not.toBe(lessItems)
})

test('returns latest non-enumerable value', () => {
  const prev = {enumerable: true}
  const next = {enumerable: true}
  Object.defineProperty(next, 'nonEnumerable', {
    value: {foo: 'bar'},
    enumerable: false,
  })
  // @ts-expect-error Object.defineProperty
  expect(immutableReconcile(next, prev).nonEnumerable).toBeUndefined()
  // @ts-expect-error Object.defineProperty
  expect(immutableReconcile(prev, next).nonEnumerable).toBe(next.nonEnumerable)
})
