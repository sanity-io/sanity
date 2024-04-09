import {evaluate, type ExprNode, parse} from 'groq-js'

import {filter as filterIt} from './filter'

function parseGroqFilter(filter: string) {
  try {
    return parse(`*[${filter}]`)
  } catch (err) {
    err.message = `Failed to parse GROQ filter "${filter}": ${err.message}`
    throw err
  }
}

export async function matchesFilter(parsedFilter: ExprNode, document: unknown) {
  const result = await (await evaluate(parsedFilter, {dataset: [document]})).get()
  return result.length === 1
}

export function groqFilter<T>(documents: AsyncIterableIterator<T>, filter: string) {
  const parsedFilter = parseGroqFilter(`*[${filter}]`)
  return filterIt(documents, (doc) => matchesFilter(parsedFilter, doc))
}
