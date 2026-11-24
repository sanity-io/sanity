import {
  type CreateDocumentVersionEvent,
  type DocumentGroupEvent,
  type EditDocumentVersionEvent,
  type PublishDocumentVersionEvent,
} from 'sanity'
import {describe, expect, it} from 'vitest'

import {
  getAncestorIds,
  getTimelineRows,
  getTransactionCounts,
  isEditTransactionEvent,
} from './timelineRows'

const DRAFT_ID = 'drafts.doc-1'

function edit(id: string, overrides: Partial<EditDocumentVersionEvent> = {}) {
  return {
    type: 'editDocumentVersion',
    id,
    revisionId: id,
    timestamp: '2024-01-01T00:00:00.000Z',
    author: 'author-1',
    contributors: ['author-1'],
    documentId: DRAFT_ID,
    documentVariantType: 'draft',
    transactions: [],
    ...overrides,
  } satisfies EditDocumentVersionEvent
}

const transaction = (id: string, parentId: string) => edit(id, {parentId, isTransaction: true})

const publish: PublishDocumentVersionEvent = {
  type: 'publishDocumentVersion',
  id: 'publish',
  revisionId: 'publish',
  timestamp: '2024-01-01T00:00:00.000Z',
  author: 'author-1',
  documentId: DRAFT_ID,
  documentVariantType: 'draft',
  versionId: DRAFT_ID,
  publishCause: 'document.publish',
}

const create: CreateDocumentVersionEvent = {
  type: 'createDocumentVersion',
  id: 'create',
  timestamp: '2024-01-01T00:00:00.000Z',
  author: 'author-1',
  documentId: DRAFT_ID,
  documentVariantType: 'draft',
  versionId: DRAFT_ID,
  versionRevisionId: 'create',
  parentId: 'publish',
}

/**
 * - group            (2 transactions listed)
 * - publish
 *   - publishedGroup (1 transaction listed)
 *   - create
 */
const EVENTS: DocumentGroupEvent[] = [
  edit('group'),
  transaction('group-tx-1', 'group'),
  transaction('group-tx-2', 'group'),
  publish,
  edit('published-group', {parentId: 'publish'}),
  transaction('published-group-tx-1', 'published-group'),
  create,
  edit('oldest'),
]

const shown = (expandedParents: string[], events = EVENTS) =>
  getTimelineRows({events, expandedParents: new Set(expandedParents)}).map(
    (row) => `${'  '.repeat(row.depth)}${row.event.id}`,
  )

describe('getTimelineRows', () => {
  it('shows only top-level events while nothing is expanded', () => {
    expect(shown([])).toEqual(['group', 'publish', 'oldest'])
  })

  it('shows the transactions of an expanded edit group one level deeper', () => {
    expect(shown(['group'])).toEqual(['group', '  group-tx-1', '  group-tx-2', 'publish', 'oldest'])
  })

  it('nests the transactions of an edit group under an expanded publish two levels deep', () => {
    expect(shown(['publish'])).toEqual([
      'group',
      'publish',
      '  published-group',
      '  create',
      'oldest',
    ])
    expect(shown(['publish', 'published-group'])).toEqual([
      'group',
      'publish',
      '  published-group',
      '    published-group-tx-1',
      '  create',
      'oldest',
    ])
  })

  it('hides the transactions of an expanded group while its parent is collapsed', () => {
    expect(shown(['published-group'])).toEqual(['group', 'publish', 'oldest'])
  })

  it('shows events whose parent is not in the list at the top level', () => {
    // E.g. the From list, which starts after the selected transaction.
    expect(shown([], EVENTS.slice(2))).toEqual(['group-tx-2', 'publish', 'oldest'])
  })

  it('keeps showing a creation event nested under a publish when it is the last event', () => {
    expect(shown([], EVENTS.slice(0, -1))).toEqual(['group', 'publish', 'create'])
  })
})

describe('getTransactionCounts', () => {
  it('counts the transactions listed under each edit group', () => {
    expect(getTransactionCounts(EVENTS)).toEqual(
      new Map([
        ['group', 2],
        ['published-group', 1],
      ]),
    )
  })
})

describe('getAncestorIds', () => {
  it('lists the events a nested event is under, closest first', () => {
    expect(getAncestorIds(EVENTS, 'published-group-tx-1')).toEqual(['published-group', 'publish'])
    expect(getAncestorIds(EVENTS, 'group-tx-2')).toEqual(['group'])
  })

  it('is empty for top-level, missing or no events', () => {
    expect(getAncestorIds(EVENTS, 'group')).toEqual([])
    expect(getAncestorIds(EVENTS, 'missing')).toEqual([])
    expect(getAncestorIds(EVENTS, undefined)).toEqual([])
  })
})

describe('isEditTransactionEvent', () => {
  it('is true only for the listed transactions of an edit group', () => {
    expect(isEditTransactionEvent(transaction('tx', 'group'))).toBe(true)
    expect(isEditTransactionEvent(edit('group'))).toBe(false)
    expect(isEditTransactionEvent(publish)).toBe(false)
  })
})
