import {
  type CreateDocumentVersionEvent,
  type DocumentGroupEvent,
  type EditDocumentVersionEvent,
  type PublishDocumentVersionEvent,
} from 'sanity'
import {describe, expect, it} from 'vitest'

import {
  getAncestorIds,
  getInitialRevealedTransactions,
  getSelectedRowIndex,
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
    (row) => `${'  '.repeat(row.depth)}${row.type === 'event' ? row.event.id : 'show more'}`,
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

  it('does not take a listed transaction sharing an id with a missing parent for that parent', () => {
    // The From list when the publish is the To event: the newest transaction of the edit group
    // under it is the publish's own revision, so it shares the publish's id.
    const fromList: DocumentGroupEvent[] = [
      edit('published-group', {parentId: 'publish'}),
      transaction('publish', 'published-group'),
      transaction('published-group-tx-1', 'published-group'),
      create,
      edit('oldest'),
    ]
    expect(shown([], fromList)).toEqual(['published-group', 'create', 'oldest'])
    expect(shown(['published-group'], fromList)).toEqual([
      'published-group',
      '  publish',
      '  published-group-tx-1',
      'create',
      'oldest',
    ])
  })

  it('keeps showing a creation event nested under a publish when it is the last event', () => {
    expect(shown([], EVENTS.slice(0, -1))).toEqual(['group', 'publish', 'create'])
  })
})

describe('paging the transactions of an edit group', () => {
  const transactionIds = Array.from({length: 35}, (_, index) => `tx-${index + 1}`)
  const events: DocumentGroupEvent[] = [
    edit('group'),
    ...transactionIds.map((id) => transaction(id, 'group')),
    edit('older'),
  ]
  const rows = (revealedTransactions?: Map<string, number>) =>
    getTimelineRows({events, expandedParents: new Set(['group']), revealedTransactions})

  it('shows the first 10 transactions followed by a "Show more" row', () => {
    const result = rows()
    expect(result).toHaveLength(1 + 10 + 1 + 1)
    expect(result.slice(1, 11).map((row) => row.type === 'event' && row.event.id)).toEqual(
      transactionIds.slice(0, 10),
    )
    expect(result[11]).toEqual({type: 'showMore', parentId: 'group', depth: 1})
    expect(result[12]).toMatchObject({type: 'event', event: {id: 'older'}})
  })

  it('shows as many transactions as revealed, and no "Show more" once all are shown', () => {
    expect(rows(new Map([['group', 30]])).filter((row) => row.type === 'showMore')).toHaveLength(1)
    expect(rows(new Map([['group', 30]]))).toHaveLength(1 + 30 + 1 + 1)

    const all = rows(new Map([['group', 50]]))
    expect(all).toHaveLength(1 + 35 + 1)
    expect(all.some((row) => row.type === 'showMore')).toBe(false)
  })

  it('pages the transactions shown at the top level when their group is not in the list', () => {
    const result = getTimelineRows({events: events.slice(1), expandedParents: new Set()})
    expect(result).toHaveLength(10 + 1 + 1)
    expect(result[10]).toEqual({type: 'showMore', parentId: 'group', depth: 0})
  })

  it('reveals enough transactions to show a selected transaction past the first 10', () => {
    expect(getInitialRevealedTransactions(events, 'tx-10')).toEqual(new Map())
    expect(getInitialRevealedTransactions(events, 'tx-11')).toEqual(new Map([['group', 30]]))
    expect(getInitialRevealedTransactions(events, 'tx-30')).toEqual(new Map([['group', 30]]))
    expect(getInitialRevealedTransactions(events, 'tx-31')).toEqual(new Map([['group', 50]]))
    expect(getInitialRevealedTransactions(events, 'group')).toEqual(new Map())
    expect(getInitialRevealedTransactions(events, undefined)).toEqual(new Map())
  })
})

describe('getSelectedRowIndex', () => {
  // The newest transaction listed under a group shares its id with the group.
  const events: DocumentGroupEvent[] = [
    edit('group'),
    transaction('group', 'group'),
    transaction('group-tx-1', 'group'),
  ]
  const rows = (expandedParents: string[]) =>
    getTimelineRows({events, expandedParents: new Set(expandedParents)})

  it('highlights the group while it is collapsed', () => {
    expect(getSelectedRowIndex(rows([]), 'group')).toBe(0)
  })

  it('highlights the newest transaction instead of the group once it is expanded', () => {
    expect(getSelectedRowIndex(rows(['group']), 'group')).toBe(1)
    expect(getSelectedRowIndex(rows(['group']), 'group-tx-1')).toBe(2)
  })

  it('is -1 when the selected event is not shown', () => {
    expect(getSelectedRowIndex(rows([]), 'group-tx-1')).toBe(-1)
    expect(getSelectedRowIndex(rows([]), undefined)).toBe(-1)
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
