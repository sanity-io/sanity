/* eslint-disable simple-import-sort/imports */
// Note: for some reason, this needs to be imported before the mocked module
import {afterEach, describe, expect, it, vitest} from 'vitest'
/* eslint-enable simple-import-sort/imports */

import {SanityEncoder} from '@sanity/mutate'

import type {Mutation} from '../../../mutations/types'
import type {Transaction} from '../../../mutations/transaction'
import {toSanityMutations, type TransactionPayload} from '../toSanityMutations'

vitest.mock('@sanity/mutate', async () => {
  // eslint-disable-next-line @typescript-eslint/consistent-type-imports
  const actual = await vitest.importActual<typeof import('@sanity/mutate')>('@sanity/mutate')
  return {
    ...actual,
    SanityEncoder: {
      ...actual.SanityEncoder,
      encodeAll: vitest.fn().mockImplementation(actual.SanityEncoder.encodeAll),
    },
  }
})

afterEach(() => {
  vitest.clearAllMocks()
})

describe('#toSanityMutations', () => {
  it('should handle single mutation', async () => {
    const mockMutation: Mutation = {
      type: 'patch',
      id: 'drafts.f9b1dc7a-9dd6-4949-8292-9738bf9e2969',
      patches: [{path: ['prependTest'], op: {type: 'setIfMissing', value: []}}],
    }

    const mockMutationIterable = async function* () {
      yield mockMutation
    }

    const iterable = toSanityMutations(mockMutationIterable())

    const result = []
    for await (const mutation of iterable) {
      result.push(mutation)
    }

    expect(result.flat()).toEqual(SanityEncoder.encodeAll([mockMutation] as any[]))
    expect(SanityEncoder.encodeAll).toHaveBeenCalledWith([mockMutation])
  })

  it('should handle multiple mutations', async () => {
    const mockMutations: Mutation[] = [
      {
        type: 'patch',
        id: 'drafts.f9b1dc7a-9dd6-4949-8292-9738bf9e2969',
        patches: [{path: ['prependTest'], op: {type: 'setIfMissing', value: []}}],
      },
      {
        type: 'patch',
        id: 'drafts.f9b1dc7a-9dd6-4949-8292-9738bf9e2969',
        patches: [
          {
            path: ['prependTest'],
            op: {
              type: 'insert',
              referenceItem: 0,
              position: 'before',
              items: [{_type: 'oops', name: 'test'}],
            },
          },
        ],
      },
    ]

    const mockMutationIterable = async function* () {
      yield mockMutations
    }

    const iterable = toSanityMutations(mockMutationIterable())

    const result = []
    for await (const mutation of iterable) {
      result.push(mutation)
    }

    expect(result.flat()).toEqual(SanityEncoder.encodeAll(mockMutations as any[]))
    expect(SanityEncoder.encodeAll).toHaveBeenCalledWith(mockMutations)
  })

  it('should handle transaction', async () => {
    const mockTransaction: Transaction = {
      type: 'transaction',
      id: 'transaction1',
      mutations: [
        {
          type: 'patch',
          id: 'drafts.f9b1dc7a-9dd6-4949-8292-9738bf9e2969',
          patches: [{path: ['prependTest'], op: {type: 'setIfMissing', value: []}}],
        },
      ],
    }

    const iterable = toSanityMutations(
      (async function* () {
        yield mockTransaction
      })(),
    )

    const result = []
    for await (const mutation of iterable) {
      result.push(mutation)
    }

    const expected: TransactionPayload = {
      transactionId: mockTransaction.id,
      mutations: SanityEncoder.encodeAll(mockTransaction.mutations as any[]),
    }

    expect(result).toEqual([expected])
    expect(SanityEncoder.encodeAll).toHaveBeenCalledWith(mockTransaction.mutations)
  })
})
