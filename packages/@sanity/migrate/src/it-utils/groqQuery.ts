import {type SanityDocument} from '@sanity/types'
import {evaluate, parse} from 'groq-js'

import {toArray} from './toArray'

function parseGroq(query: string) {
  try {
    return parse(query)
  } catch (err) {
    err.message = `Failed to parse GROQ filter "${query}": ${err.message}`
    throw err
  }
}

export async function groqQuery<T>(
  it: AsyncIterableIterator<SanityDocument>,
  query: string,
  params?: Record<string, any>,
): Promise<T> {
  const parsedFilter = parseGroq(query)
  const all = await toArray(it)
  return (await evaluate(parsedFilter, {dataset: all, params})).get()
}
