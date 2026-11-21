import {type EditStateFor, type SanityDocument} from 'sanity'
import {describe, expect, it} from 'vitest'

import {isDocumentLoading} from '../isDocumentLoading'

const document = {
  _id: 'drafts.book',
  _type: 'book',
  _rev: 'rev',
  _createdAt: '2026-01-01T00:00:00Z',
  _updatedAt: '2026-01-01T00:00:00Z',
} satisfies SanityDocument

function editState(overrides: Partial<EditStateFor>): EditStateFor {
  return {
    id: 'book',
    type: 'book',
    draft: null,
    published: null,
    version: null,
    liveEdit: false,
    liveEditSchemaType: false,
    ready: false,
    transactionSyncLock: null,
    release: undefined,
    scopeId: undefined,
    ...overrides,
  }
}

describe('isDocumentLoading', () => {
  it('is loading before any snapshot or cached copy exists', () => {
    expect(isDocumentLoading(undefined)).toBe(true)
    expect(isDocumentLoading(editState({}))).toBe(true)
  })

  it('is not loading once the snapshots of a new document have loaded', () => {
    expect(isDocumentLoading(editState({ready: true}))).toBe(false)
  })

  it.each(['draft', 'published', 'version'] as const)(
    'is not loading with a cached %s',
    (member) => {
      expect(isDocumentLoading(editState({[member]: document}))).toBe(false)
    },
  )
})
