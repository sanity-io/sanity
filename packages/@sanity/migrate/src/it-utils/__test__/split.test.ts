import {expect, test} from 'vitest'

import {split} from '../split'

test('split multiple chunks by newline', async () => {
  const gen = async function* () {
    yield 'first\nsec'
    yield 'ond\nthir'
    yield 'd'
  }

  const it = split(gen(), '\n')

  expect(await it.next()).toEqual({value: 'first', done: false})
  expect(await it.next()).toEqual({value: 'second', done: false})
  expect(await it.next()).toEqual({value: 'third', done: false})
  expect(await it.next()).toEqual({value: undefined, done: true})
})

test('split multiple chunks with several delimiters', async () => {
  const gen = async function* () {
    yield 'first\nsecond\nthird\n'
    yield 'f'
    yield 'o'
    yield 'u'
    yield 'r'
    yield 'th'
  }

  const it = split(gen(), '\n')

  expect(await it.next()).toEqual({value: 'first', done: false})
  expect(await it.next()).toEqual({value: 'second', done: false})
  expect(await it.next()).toEqual({value: 'third', done: false})
  expect(await it.next()).toEqual({value: 'fourth', done: false})
  expect(await it.next()).toEqual({value: undefined, done: true})
})
