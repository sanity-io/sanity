import {type SanityDocument} from '@sanity/types'
import groq, {type ExprNode} from 'groq-js'

import {type Migration} from '../../types'

function isSystemDocumentId(id: string) {
  return id.startsWith('_.')
}

async function* filterDocumentTypes(
  documents: AsyncIterableIterator<SanityDocument>,
  types: string[],
) {
  for await (const doc of documents) {
    if (types.includes(doc._type)) {
      yield doc
    }
  }
}

function parseGroqFilter(filter: string) {
  try {
    return groq.parse(`*[${filter}]`)
  } catch (err) {
    err.message = `Failed to parse GROQ filter "${filter}": ${err.message}`
    throw err
  }
}

export async function matchesFilter(parsedFilter: ExprNode, document: SanityDocument) {
  const result = await (await groq.evaluate(parsedFilter, {dataset: [document]})).get()
  return result.length === 1
}

export async function* applyFilters(
  migration: Migration,
  documents: AsyncIterableIterator<SanityDocument>,
) {
  const documentTypes = migration.documentTypes
  const parsedFilter = migration.filter ? parseGroqFilter(migration.filter) : undefined

  for await (const doc of documents) {
    if (isSystemDocumentId(doc._id)) {
      continue
    }
    if (documentTypes && documentTypes.length > 0 && !documentTypes.includes(doc._type)) {
      continue
    }
    if (parsedFilter && !(await matchesFilter(parsedFilter, doc))) {
      continue
    }
    yield doc
  }
}
