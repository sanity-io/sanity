import {describe, expect, test} from '@jest/globals'

import {extractSliceParams, safeParseQuery} from '../safeParseQuery'

const variants = [
  {
    query: '*[_type == "author"][$from...$to]',
    params: ['from', 'to'],
  },
  {
    query: '*[_type == "author"][$from...5]',
    params: ['from'],
  },
  {
    query: '*[_type == "author"][5...$to]',
    params: ['to'],
  },
  {
    query: '*[_type == "author"][3...5]',
    params: [],
  },
  {
    query: '*[_type == "author"][3...5] { name, "foo": *[_type == "bar"][0...$limit] }',
    params: ['limit'],
  },
  {
    query: '*[_type == "author"][$from...$to] { name, "foo": *[_type == "bar"][0...$limit] }',
    params: ['from', 'to', 'limit'],
  },
]
describe('safeParseQuery', () => {
  test.each(variants)('can extract: $query', async (variant) => {
    const params = collectAll(extractSliceParams(variant.query))
    expect(params).toStrictEqual(variant.params)
  })
  test.each(variants)('can parse: $query', async (variant) => {
    safeParseQuery(variant.query)
  })
})

function collectAll<T>(iterator: Generator<T>) {
  const res = []
  for (const item of iterator) {
    res.push(item)
  }
  return res
}
