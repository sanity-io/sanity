import {evaluate, parse} from 'groq-js'
import {describe, expect, it} from 'vitest'

import {EXCLUDE_RELEASE_DOCUMENTS_FILTER} from '../excludeReleaseDocumentsFilter'

const dataset = [
  {_id: 'author-1', _type: 'author'},
  {_id: 'book-1', _type: 'book', author: {_type: 'reference', _ref: 'author-1'}},
  {_id: 'drafts.book-2', _type: 'book', author: {_type: 'reference', _ref: 'author-1'}},
  {
    _id: '_.releases.rSpring',
    _type: 'system.release',
    metadata: {owner: {_type: 'reference', _ref: 'author-1', _weak: true}},
  },
  {
    _id: '_.releases.rSummer',
    _type: 'system.release',
    metadata: {signOff: {owner: {_type: 'reference', _ref: 'author-1', _weak: true}}},
  },
]

async function referrerIds(filter: string) {
  const result = await evaluate(parse(`*[references($id) && ${filter}]._id`), {
    dataset,
    params: {id: 'author-1'},
  })
  return result.get()
}

describe('EXCLUDE_RELEASE_DOCUMENTS_FILTER', () => {
  it('finds release documents that reference the document without the filter', async () => {
    expect(await referrerIds('true')).toEqual(
      expect.arrayContaining(['_.releases.rSpring', '_.releases.rSummer']),
    )
  })

  it('leaves out release documents whether the reference is top level or nested', async () => {
    expect(await referrerIds(EXCLUDE_RELEASE_DOCUMENTS_FILTER)).toEqual(['book-1', 'drafts.book-2'])
  })
})
