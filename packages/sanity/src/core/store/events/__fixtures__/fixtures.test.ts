import {applyPatch} from 'mendoza'
import {afterEach, describe, expect, it, vi} from 'vitest'

import {getTransactionsLogs} from '../../translog/getTransactionsLogs'
import {getEffectState} from '../getEditEvents'
import {createMockClient, createTranslogFetchStub} from './mockClient'
import {
  createTransaction,
  deleteTransaction,
  DRAFT_ID,
  editTransaction,
  effectPair,
} from './transactions.fixture'

describe('transactions.fixture', () => {
  it('produces effect pairs that getEffectState classifies as expected', () => {
    expect(getEffectState(editTransaction().effects[DRAFT_ID])).toBe('modified')
    expect(getEffectState(createTransaction().effects[DRAFT_ID])).toBe('created')
    expect(getEffectState(deleteTransaction().effects[DRAFT_ID])).toBe('deleted')
    expect(getEffectState(undefined)).toBe('noop')
  })

  it('produces mendoza patches that replay with applyPatch', () => {
    const before = {_id: DRAFT_ID, name: 'before'}
    const after = {_id: DRAFT_ID, name: 'after'}
    const {apply, revert} = effectPair({before, after})

    expect(applyPatch(before, apply)).toEqual(after)
    expect(applyPatch(after, revert)).toEqual(before)
  })
})

describe('createMockClient', () => {
  it('records requests and routes responses through respond', async () => {
    const {client, requests} = createMockClient({
      respond: (request) => ({echo: request.url}),
    })

    const response = await new Promise((resolve) => {
      client.observable.request({url: '/data/test', tag: 'test-tag'}).subscribe(resolve)
    })

    expect(response).toEqual({echo: '/data/test'})
    expect(requests).toEqual([{url: '/data/test', tag: 'test-tag'}])
  })

  it('emits an error when respond throws', async () => {
    const {client} = createMockClient({
      respond: () => {
        throw new Error('boom')
      },
    })

    const error = await new Promise((resolve) => {
      client.observable.request({url: '/data/test'}).subscribe({error: resolve})
    })

    expect(error).toEqual(new Error('boom'))
  })
})

describe('createTranslogFetchStub', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('serves NDJSON entries through getTransactionsLogs', async () => {
    const entries = [
      editTransaction({id: 'tx-1'}),
      editTransaction({id: 'tx-2', timestamp: '2024-01-01T00:01:00.000Z'}),
    ]
    const stub = createTranslogFetchStub(() => entries)
    vi.stubGlobal('fetch', stub.fetch)

    const {client} = createMockClient()
    const transactions = await getTransactionsLogs(client, DRAFT_ID, {
      tag: 'sanity.studio.test',
      effectFormat: 'mendoza',
    })

    expect(transactions).toEqual(entries)
    expect(stub.calls).toHaveLength(1)
    expect(stub.calls[0]).toContain(`/transactions/${DRAFT_ID}?`)
    expect(stub.calls[0]).toContain('effectFormat=mendoza')
  })

  it('surfaces translog error entries as thrown errors', async () => {
    const stub = createTranslogFetchStub(() => ({
      error: {description: 'something failed', type: 'someError'},
    }))
    vi.stubGlobal('fetch', stub.fetch)

    const {client} = createMockClient()
    await expect(getTransactionsLogs(client, DRAFT_ID, {})).rejects.toThrow('something failed')
  })
})
