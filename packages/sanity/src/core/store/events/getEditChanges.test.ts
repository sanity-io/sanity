import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

import {collectEmissions} from './__fixtures__/collect.fixture'
import {DRAFT_ID, minutesAfterBase} from './__fixtures__/events.fixture'
import {createMockClient, createTranslogFetchStub} from './__fixtures__/mockClient'
import {editTransaction} from './__fixtures__/transactions.fixture'
import {clearDocumentRevisionCache} from './getDocumentAtRevision'
import {clearDocumentTransactionsCache} from './getDocumentTransactions'
import {getEditChanges} from './getEditChanges'

const tx1 = editTransaction({
  id: 'tx-1',
  timestamp: minutesAfterBase(1),
  before: {_id: DRAFT_ID, name: 'Ada', role: 'developer'},
  after: {_id: DRAFT_ID, name: 'Ada Lovelace', role: 'developer'},
})
const tx2 = editTransaction({
  id: 'tx-2',
  timestamp: minutesAfterBase(2),
  before: {_id: DRAFT_ID, name: 'Ada Lovelace', role: 'developer'},
  after: {_id: DRAFT_ID, name: 'Ada Lovelace', role: 'designer'},
})

/** The translog as the API serves it: a range includes its `fromTransaction`. */
function stubTranslog() {
  const translog = [tx1, tx2]
  const stub = createTranslogFetchStub((url) => {
    const params = new URL(url).searchParams
    const from = translog.findIndex((entry) => entry.id === params.get('fromTransaction'))
    const to = translog.findIndex((entry) => entry.id === params.get('toTransaction'))
    return translog.slice(from, to + 1)
  })
  vi.stubGlobal('fetch', stub.fetch)
  return stub
}

function setup(documents: Record<string, unknown> = {}) {
  const {client} = createMockClient({
    respond: (request) => {
      const revision = new URL(request.url, 'https://example.test').searchParams.get('revision')
      const document = revision && documents[revision]
      return {documents: document ? [document] : []}
    },
  })
  return client
}

const AT_TX_2 = {
  _id: DRAFT_ID,
  _type: 'author',
  _rev: 'tx-2',
  name: 'Ada Lovelace',
  role: 'designer',
}

describe('getEditChanges', () => {
  beforeEach(() => {
    clearDocumentRevisionCache()
    clearDocumentTransactionsCache()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('diffs the document before the first transaction with the one after the last, without annotations', async () => {
    const translog = stubTranslog()
    const client = setup({'tx-2': AT_TX_2})

    const {values, subscription} = collectEmissions(
      getEditChanges({client, documentId: DRAFT_ID, fromRevisionId: 'tx-1', toRevisionId: 'tx-2'}),
    )
    await vi.waitFor(() => expect(values.at(-1)?.loading).toBe(false))
    subscription.unsubscribe()

    expect(values[0]).toEqual({loading: true, diff: null, error: null})
    const {diff, error} = values.at(-1)!
    expect(error).toBeNull()
    expect(diff?.fields.name).toMatchObject({
      action: 'changed',
      fromValue: 'Ada',
      toValue: 'Ada Lovelace',
      annotation: null,
    })
    expect(diff?.fields.role).toMatchObject({
      action: 'changed',
      fromValue: 'developer',
      toValue: 'designer',
      annotation: null,
    })
    // The first transaction is fetched on its own, the translog leaves it out of a range.
    expect(translog.calls.map((url) => new URL(url).searchParams.toString())).toEqual([
      expect.stringContaining('fromTransaction=tx-1&toTransaction=tx-1'),
      expect.stringContaining('fromTransaction=tx-1&toTransaction=tx-2'),
    ])
  })

  it('diffs a single transaction with the document before it', async () => {
    stubTranslog()
    const client = setup({'tx-2': AT_TX_2})

    const {values, subscription} = collectEmissions(
      getEditChanges({client, documentId: DRAFT_ID, fromRevisionId: 'tx-2', toRevisionId: 'tx-2'}),
    )
    await vi.waitFor(() => expect(values.at(-1)?.loading).toBe(false))
    subscription.unsubscribe()

    const {diff} = values.at(-1)!
    expect(diff?.fields.name).toMatchObject({action: 'unchanged'})
    expect(diff?.fields.role).toMatchObject({fromValue: 'developer', toValue: 'designer'})
  })

  it('emits an error when the document at the last revision is missing', async () => {
    stubTranslog()
    const client = setup({})

    const {values, subscription} = collectEmissions(
      getEditChanges({client, documentId: DRAFT_ID, fromRevisionId: 'tx-1', toRevisionId: 'tx-2'}),
    )
    await vi.waitFor(() => expect(values.at(-1)?.loading).toBe(false))
    subscription.unsubscribe()

    expect(values.at(-1)).toEqual({
      loading: false,
      diff: null,
      error: new Error('Missing document for revision tx-2'),
    })
  })

  it('emits an error when the transactions cannot be fetched', async () => {
    vi.stubGlobal(
      'fetch',
      createTranslogFetchStub(() => ({error: {type: 'translogUnavailable'}})).fetch,
    )
    const client = setup({'tx-2': AT_TX_2})

    const {values, subscription} = collectEmissions(
      getEditChanges({client, documentId: DRAFT_ID, fromRevisionId: 'tx-1', toRevisionId: 'tx-2'}),
    )
    await vi.waitFor(() => expect(values.at(-1)?.loading).toBe(false))
    subscription.unsubscribe()

    expect(values.at(-1)).toMatchObject({diff: null, error: new Error('translogUnavailable')})
  })
})
