import {expectTypeOf, test} from 'vitest'

import {type Path} from '../../types'
import {type Get, type GetAtPath, getAtPath} from '../getAtPath'

test('Get (shallow) typings', () => {
  expectTypeOf<
    Get<
      {_key: 'baz'},
      [
        {_key: 'f'; foo: 'bar'},
        {_key: 'baz'; foo: 'baz'},
        {_key: 'q'; foo: 'qux'},
      ]
    >
  >().toEqualTypeOf<{
    _key: 'baz'
    foo: 'baz'
  }>()

  expectTypeOf<Get<2, ['foo', {_key: 'hi'}, 'bar']>>().toEqualTypeOf<'bar'>()

  expectTypeOf<Get<2, string[]>>()
    // @ts-expect-error - todo
    .toEqualTypeOf<string | undefined>()

  expectTypeOf<
    Get<{_key: 'hi'}, ['foo', {_key: 'hi'; title: 'this is the one'}, 'bar']>
  >().toEqualTypeOf<{_key: 'hi'; title: 'this is the one'}>()

  expectTypeOf<Get<{_key: 'second'}, {_key: string; title: string}[]>>()
    // @ts-expect-error - todo
    .toEqualTypeOf<{_key: string; title: string} | undefined>()

  expectTypeOf<Get<'foo', {foo: 'bar'}>>().toEqualTypeOf<'bar'>()
})

test('DeepGet typings', () => {
  expectTypeOf<
    GetAtPath<[1, 'name'], [{name: 'foo'}, {name: 'bar'}, {name: 'baz'}]>
  >().toEqualTypeOf<'bar'>()

  expectTypeOf<
    GetAtPath<
      [{_key: 'second'}, 'title'],
      [
        {_key: 'first'; title: 'First'},
        {_key: 'second'; title: 'Second'},
        {_key: 'third'; title: 'Third'},
      ]
    >
  >().toEqualTypeOf<'Second'>()

  expectTypeOf<
    GetAtPath<[{_key: 'second'}, 'title'], {_key: string; title: string}[]>
  >()
    // @ts-expect-error - todo
    .toEqualTypeOf<string | undefined>()

  expectTypeOf<
    GetAtPath<[{_key: 'zzz'; foo: 'bar'}, 2], never>
  >().toEqualTypeOf<never>()
})

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

  expectTypeOf(getAtPath([], testDoc)).toEqualTypeOf(testDoc)

  const path: Path = ['items']

  expectTypeOf(getAtPath(path, testDoc)).toEqualTypeOf<unknown>()

  expectTypeOf(getAtPath(['items'], testDoc)).toEqualTypeOf(testDoc.items)

  expectTypeOf(getAtPath(['nonexistent'], testDoc)).toEqualTypeOf<never>()

  expectTypeOf(getAtPath(['items', 3, 'letters', 2], testDoc)).toEqualTypeOf(
    'c' as const,
  )

  expectTypeOf(getAtPath([1], testDoc.items)).toEqualTypeOf(testDoc.items[1])

  expectTypeOf(getAtPath(['items', 2, 'letters', 2], testDoc)).toEqualTypeOf(
    testDoc.items[2].letters[2],
  )

  expectTypeOf(
    getAtPath(['items', {_key: 'b'}, 'letters', 2], testDoc),
  ).toEqualTypeOf(testDoc.items[1].letters[2])

  type MostlyLiteral = {
    title: string
    items: [
      {_key: 'a'; letters: ['a', 'b', 'c']},
      {_key: 'b'; letters: ['a', 'b', 'c']},
      {_key: 'c'; letters: ['x', 'y', 'z']},
      {_key: 'd'; letters: ['a', 'b', 'c']},
    ]
  }

  const literal: MostlyLiteral = {
    title: 'hello',
    items: [
      {_key: 'a', letters: ['a', 'b', 'c']},
      {_key: 'b', letters: ['a', 'b', 'c']},
      {_key: 'c', letters: ['x', 'y', 'z']},
      {_key: 'd', letters: ['a', 'b', 'c']},
    ],
  }

  expectTypeOf(getAtPath(['items', 2, 'letters', 2], literal)).toEqualTypeOf(
    literal.items[2].letters[2],
  )
})
