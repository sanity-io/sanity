import {expect, test} from 'vitest'

import {parseJSON} from '../json'

test('parse JSON', async () => {
  const gen = async function* () {
    yield '{"someString": "string"}'
    yield '{"someNumber": 42}'
  }

  const it = parseJSON(gen())

  expect(await it.next()).toEqual({value: {someString: 'string'}, done: false})
  expect(await it.next()).toEqual({value: {someNumber: 42}, done: false})
  expect(await it.next()).toEqual({value: undefined, done: true})
})

test('parse JSON with a custom parser', async () => {
  const gen = async function* () {
    yield '{"someString": "string"}'
    yield '{"someNumber": 42}'
  }

  const it = parseJSON(gen(), {
    parse: (line) => ({
      parsed: JSON.parse(line),
    }),
  })

  expect(await it.next()).toEqual({value: {parsed: {someString: 'string'}}, done: false})
  expect(await it.next()).toEqual({value: {parsed: {someNumber: 42}}, done: false})
  expect(await it.next()).toEqual({value: undefined, done: true})
})
