import {EOL} from 'node:os'
import {Readable} from 'node:stream'

import {describe, expect, it} from 'vitest'

import {findNdjsonEntry, readNdjsonFile} from './findNdjsonEntry'

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

describe('findNdjsonEntry', () => {
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

    for await (const match of findNdjsonEntry<Entry>(
      invalidStream(),
      (entry) => entry.id === 'a',
    )) {
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
})

describe('readNdjsonFile', () => {
  it('reads all entries from an NDJSON stream', async () => {
    const entries = await readNdjsonFile<Entry>(stream())

    expect(entries).toHaveLength(3)
    expect(entries).toEqual([
      {id: 'a', value: 'a0'},
      {id: 'b', value: 'b0'},
      {id: 'b', value: 'b1'},
    ])
  })

  it('returns an empty array for an empty stream', async () => {
    const emptyStream = Readable.from('')
    const entries = await readNdjsonFile<Entry>(emptyStream)

    expect(entries).toEqual([])
  })

  it('skips empty lines', async () => {
    const ndjsonWithEmptyLines = [
      JSON.stringify({id: 'a', value: 'a0'}),
      '',
      JSON.stringify({id: 'b', value: 'b0'}),
      '   ',
      JSON.stringify({id: 'c', value: 'c0'}),
    ].join(EOL)

    const entries = await readNdjsonFile<Entry>(Readable.from(ndjsonWithEmptyLines))

    expect(entries).toHaveLength(3)
    expect(entries).toEqual([
      {id: 'a', value: 'a0'},
      {id: 'b', value: 'b0'},
      {id: 'c', value: 'c0'},
    ])
  })

  it('throws an error if invalid JSON is encountered', async () => {
    const invalidNdjson = [ndjson, `{ invalid`].join(EOL)
    const invalidStream = Readable.from(invalidNdjson)

    await expect(readNdjsonFile<Entry>(invalidStream)).rejects.toThrow()
  })
})
