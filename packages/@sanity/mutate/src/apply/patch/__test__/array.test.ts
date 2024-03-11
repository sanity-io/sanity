import {expect, test} from 'vitest'

import {insert, replace} from '../../../mutations/operations/creators'
import {applyOp} from '../applyOp'

test('replace on item', () => {
  expect(applyOp(replace('replaced', 1), ['foo', 'bar', 'baz'])).toEqual([
    'foo',
    'replaced',
    'baz',
  ])
})

// note: although a bit inconsistent and possibly surprising, this is the behavior of the sanity data store
test('replace on index 0 and -1 of empty array', () => {
  expect(applyOp(replace('item!', 0), [])).toEqual(['item!'])
  expect(applyOp(replace('item!', -1), [])).toEqual(['item!'])
})

test('replace out of range', () => {
  expect(() => applyOp(replace('three', 2), ['one', 'two'])).toThrow()
})

test('replace with multiple values', () => {
  expect(
    applyOp(replace(['first', 'second'], 0), ['was here', 'another']),
  ).toEqual(['first', 'second'])
})
test('insert within bounds', () => {
  expect(
    applyOp(insert(['hello', 'world'], 'after', 2), ['one', 'two', 'three']),
  ).toEqual(['one', 'two', 'three', 'hello', 'world'])

  expect(
    applyOp(insert(['hello', 'world'], 'after', -1), ['one', 'two', 'three']),
  ).toEqual(['one', 'two', 'three', 'hello', 'world'])

  expect(
    applyOp(insert(['hello', 'world'], 'after', -3), ['one', 'two', 'three']),
  ).toEqual(['one', 'hello', 'world', 'two', 'three'])
  expect(
    applyOp(insert(['hello', 'world'], 'before', 1), ['one', 'two', 'three']),
  ).toEqual(['one', 'hello', 'world', 'two', 'three'])
  expect(
    applyOp(insert(['hello', 'world'], 'before', 0), ['one', 'two', 'three']),
  ).toEqual(['hello', 'world', 'one', 'two', 'three'])
})

test('insert into empty array', () => {
  expect(applyOp(insert(['one'], 'after', 0), [])).toEqual(['one'])
  expect(applyOp(insert(['one'], 'after', -1), [])).toEqual(['one'])
  expect(applyOp(insert(['foo', 'bar', 'baz'], 'after', 0), [])).toEqual([
    'foo',
    'bar',
    'baz',
  ])
  expect(applyOp(insert(['foo', 'bar', 'baz'], 'after', -1), [])).toEqual([
    'foo',
    'bar',
    'baz',
  ])
})

test('insert into empty arrays and arrays with a single item', () => {
  // empty arrays
  expect(applyOp(insert(['one', 'two'], 'before', 0), [])).toEqual([
    'one',
    'two',
  ])

  expect(applyOp(insert(['one', 'two'], 'before', -1), [])).toEqual([
    'one',
    'two',
  ])

  // out of bounds on empty arrays
  expect(() => applyOp(insert(['one', 'two'], 'before', -2), [])).toThrow()
  expect(() => applyOp(insert(['one', 'two'], 'before', 1), [])).toThrow()

  // insert before first element
  expect(
    applyOp(insert(['INSERTED 1', 'INSERTED 2'], 'before', 0), ['one']),
  ).toEqual(['INSERTED 1', 'INSERTED 2', 'one'])

  // insert after first element
  expect(
    applyOp(insert(['INSERTED 1', 'INSERTED 2'], 'after', 0), ['one']),
  ).toEqual(['one', 'INSERTED 1', 'INSERTED 2'])

  // insert before last element
  expect(
    applyOp(insert(['INSERTED 1', 'INSERTED 2'], 'before', -1), ['one']),
  ).toEqual(['INSERTED 1', 'INSERTED 2', 'one'])
  // insert after last element
  expect(
    applyOp(insert(['INSERTED 1', 'INSERTED 2'], 'after', -1), ['one']),
  ).toEqual(['one', 'INSERTED 1', 'INSERTED 2'])
})

test('insert at edges of arrays with more than one items', () => {
  expect(
    applyOp(insert(['INSERTED 1', 'INSERTED 2'], 'after', 0), ['one', 'two']),
  ).toEqual(['one', 'INSERTED 1', 'INSERTED 2', 'two'])
  expect(
    applyOp(insert(['INSERTED 1', 'INSERTED 2'], 'after', 1), ['one', 'two']),
  ).toEqual(['one', 'two', 'INSERTED 1', 'INSERTED 2'])
  expect(
    applyOp(insert(['INSERTED 1', 'INSERTED 2'], 'before', -1), ['one', 'two']),
  ).toEqual(['one', 'INSERTED 1', 'INSERTED 2', 'two'])
})

test('insert out of bounds', () => {
  // note: the weird thing about -1 is that it can never be out of bounds as long as
  // the array has items: it always points at either the one or the last element
  // (`after: -1` is after the last, while `before: -1` is before the last)

  // empty arrays
  // Note: -1 and 0 is always within bounds for empty arrays as per current sanity datastore implementation
  expect(applyOp(insert(['INSERT!'], 'after', 0), [])).toEqual(['INSERT!'])
  expect(applyOp(insert(['INSERT!'], 'after', -1), [])).toEqual(['INSERT!'])
  expect(applyOp(insert(['INSERT!'], 'before', 0), [])).toEqual(['INSERT!'])
  expect(applyOp(insert(['INSERT!'], 'before', -1), [])).toEqual(['INSERT!'])

  expect(() => applyOp(insert(['INSERT!'], 'after', 1), [])).toThrow()
  expect(() => applyOp(insert(['INSERT!'], 'before', 1), [])).toThrow()
  expect(() => applyOp(insert(['INSERT!'], 'after', -2), [])).toThrow()
  expect(() => applyOp(insert(['INSERT!'], 'before', -2), [])).toThrow()
  expect(() => applyOp(insert(['INSERT!'], 'before', 2), [])).toThrow()
  expect(() => applyOp(insert(['INSERT!'], 'after', 2), [])).toThrow()
})

// // arrays with single items
test('insert relative to keyed path elements', () => {
  const arr = ['before', {_key: 'foo'}, 'after']
  expect(applyOp(insert(['INSERT!'], 'before', {_key: 'foo'}), arr)).toEqual([
    'before',
    'INSERT!',
    {_key: 'foo'},
    'after',
  ])
  expect(applyOp(insert(['INSERT!'], 'after', {_key: 'foo'}), arr)).toEqual([
    'before',
    {_key: 'foo'},
    'INSERT!',
    'after',
  ])
})

test('insert relative to nonexisting keyed path elements', () => {
  expect(() =>
    applyOp(insert(['INSERT!'], 'after', {_key: 'foo'}), []),
  ).toThrow()
})
