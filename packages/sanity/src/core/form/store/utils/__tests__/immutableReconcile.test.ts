import {defineField, defineType} from '@sanity/types'
import {beforeEach, expect, type Mock, test, vi} from 'vitest'

import {createSchema} from '../../../../schema/createSchema'
import {createImmutableReconcile} from '../immutableReconcile'

const immutableReconcile = createImmutableReconcile({decorator: vi.fn})

beforeEach(() => {
  ;(immutableReconcile as Mock).mockClear()
})

test('it preserves previous value if shallow equal', () => {
  const prev = {test: 'hi'}
  const next = {test: 'hi'}
  const reconciled = immutableReconcile(prev, next)
  expect(reconciled).toBe(prev)
  expect(immutableReconcile).toHaveBeenCalledTimes(2)
})

test('it preserves previous value if deep equal', () => {
  const prev = {arr: [{foo: 'bar'}]}
  const next = {arr: [{foo: 'bar'}]}
  const reconciled = immutableReconcile(prev, next)
  expect(reconciled).toBe(prev)
  expect(immutableReconcile).toHaveBeenCalledTimes(4)
})

test('it preserves previous nodes that are deep equal', () => {
  const prev = {arr: [{foo: 'bar'}], x: 1}
  const next = {arr: [{foo: 'bar'}]}
  const reconciled = immutableReconcile(prev, next)
  expect(reconciled.arr).toBe(prev.arr)
})

test('it keeps equal objects in arrays', () => {
  const prev = {arr: ['foo', {greet: 'hello'}, {other: []}], x: 1}
  const next = {arr: ['bar', {greet: 'hello'}, {other: []}]}
  const reconciled = immutableReconcile(prev, next)

  expect(reconciled.arr).not.toBe(prev.arr)
  expect(reconciled.arr[1]).toBe(prev.arr[1])
  expect(reconciled.arr[2]).toBe(prev.arr[2])
  expect(immutableReconcile).toHaveBeenCalledTimes(7)
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

  const reconciled = immutableReconcile(prev, next)

  expect(reconciled).not.toBe(prev)
  expect(reconciled).not.toBe(next)

  expect(reconciled.array).toBe(prev.array)
  expect(reconciled.object.keep).toBe(prev.object.keep)
  expect(immutableReconcile).toHaveBeenCalledTimes(11)
})

test('skips reconciling if the previous sub-values are already referentially equal', () => {
  const keep = {foo: 'bar'}
  const prev = {
    test: 'hi',
    array: ['aloha', keep],
    object: {
      x: {y: 'CHANGE'},
      keep,
    },
  }
  const next = {
    test: 'hi',
    array: ['aloha', keep],
    object: {
      x: {y: 'CHANGED'},
      keep,
    },
    new: ['foo', 'bar'],
  }

  const reconciled = immutableReconcile(prev, next)

  expect(reconciled).not.toBe(prev)
  expect(reconciled).not.toBe(next)

  expect(reconciled.array).toBe(prev.array)
  expect(reconciled.object.keep).toBe(prev.object.keep)
  expect(immutableReconcile).toHaveBeenCalledTimes(9)
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

test('does not reconcile schema type values', () => {
  const schema = createSchema({
    name: 'default',
    types: [
      defineType({
        name: 'myType',
        type: 'document',
        fields: [defineField({name: 'myString', type: 'string'})],
      }),
      defineType({
        name: 'myOtherType',
        type: 'document',
        fields: [defineField({name: 'myString2', type: 'string'})],
      }),
    ],
  })
  const schemaType = schema.get('myType')!
  const otherSchemaType = schema.get('myOtherType')!

  const prev = {schemaType}
  const next = {schemaType: otherSchemaType}

  const reconciled = immutableReconcile(prev, next)
  expect(reconciled.schemaType).toBe(otherSchemaType)
  expect(immutableReconcile).toHaveBeenCalledTimes(2)
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
