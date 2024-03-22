/* eslint-disable simple-import-sort/imports */
// Note: for some reason, this needs to be imported before the mocked module
import {afterEach, describe, expect, it, vitest} from 'vitest'
/* eslint-enable simple-import-sort/imports */

import {SanityEncoder} from '@sanity/mutate'

import {type Mutation, type Transaction} from '../../../mutations'
import {toSanityMutations, type TransactionPayload} from '../toSanityMutations'

vitest.mock('@bjoerge/mutiny', async () => {
  // eslint-disable-next-line @typescript-eslint/consistent-type-imports
  const actual = await vitest.importActual<typeof import('@bjoerge/mutiny')>('@bjoerge/mutiny')
  return {
    ...actual,
    SanityEncoder: {
      ...actual.SanityEncoder.encode,
      encode: vitest.fn().mockImplementation(actual.SanityEncoder.encode),
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

    expect(result.flat()).toEqual(SanityEncoder.encode([mockMutation] as any))
    expect(SanityEncoder.encode).toHaveBeenCalledWith([mockMutation])
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

    expect(result.flat()).toEqual(SanityEncoder.encode(mockMutations as any))
    expect(SanityEncoder.encode).toHaveBeenCalledWith(mockMutations)
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
      mutations: SanityEncoder.encode(mockTransaction.mutations as any),
    }

    expect(result).toEqual([expected])
    expect(SanityEncoder.encode).toHaveBeenCalledWith(mockTransaction.mutations)
  })
})
