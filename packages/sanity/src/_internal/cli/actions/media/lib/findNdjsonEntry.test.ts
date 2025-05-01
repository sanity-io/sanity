import {EOL} from 'node:os'
import {Readable} from 'node:stream'
import {expect, it} from 'vitest'
import {findNdjsonEntry} from './findNdjsonEntry'

interface Entry {
  id: string
  value: string
}

const ndjson = (
  [
    {id: 'a', value: 'a0'},
    {id: 'b', value: 'b0'},
    {id: 'b', value: 'b1'},
  ] satisfies Entry[]
)
  .map((entry) => JSON.stringify(entry))
  .join(EOL)

const stream = () => Readable.from(ndjson)

it('yields the first entry that satisfies the matcher', async () => {
  expect.assertions(1)

  for await (const match of findNdjsonEntry<Entry>(stream(), (entry) => entry.id === 'b')) {
    expect(match).toHaveProperty('value', 'b0')
  }
})

it('yields `undefined` if no entry satisfies the matcher', async () => {
  expect.assertions(1)

  for await (const match of findNdjsonEntry<Entry>(stream(), (entry) => entry.id === 'c')) {
    expect(match).toBeUndefined()
  }
})

it('throws an error if invalid JSON is encountered before match', async () => {
  const invalidNdjson = [ndjson, `{ invalid`].join(EOL)
  const invalidStream = () => Readable.from(invalidNdjson)
  let hasThrown = false
  expect.assertions(2)

  for await (const match of findNdjsonEntry<Entry>(invalidStream(), (entry) => entry.id === 'a')) {
    expect(match).toHaveProperty('value', 'a0')
  }

  try {
    for await (const match of findNdjsonEntry(invalidStream(), () => false)) {
    }
  } catch (error) {
    hasThrown = true
  }

  expect(hasThrown).toBe(true)
})
