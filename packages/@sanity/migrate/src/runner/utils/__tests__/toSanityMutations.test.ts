import {SanityEncoder} from '@bjoerge/mutiny'

import {type Mutation, type Transaction} from '../../../mutations'
import {toSanityMutations, type TransactionPayload} from '../toSanityMutations'

jest.mock('@bjoerge/mutiny', () => {
  const actual = jest.requireActual('@bjoerge/mutiny')
  return {
    ...actual,
    SanityEncoder: {
      encode: jest.fn().mockImplementation(actual.SanityEncoder.encode),
    },
  }
})

afterEach(() => {
  jest.clearAllMocks()
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
