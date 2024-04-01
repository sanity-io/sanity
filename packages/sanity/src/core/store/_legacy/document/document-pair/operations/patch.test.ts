import {beforeEach, describe, expect, it, jest} from '@jest/globals'
import {from, of} from 'rxjs'

import {createMockSanityClient} from '../../../../../../../test/mocks/mockSanityClient'
import {isLiveEditEnabled} from '../utils/isLiveEditEnabled'
import {patch} from './patch'
import {type OperationArgs} from './types'

/* There are many other possible states to consider, this is just a start.
 * "target" here could refer to a draft OR a published doc,
 * since they (and any other possible versions) will have their own document operations
 */
const serverStatuses = [
  //the published or draft version is not there when we expected it to be
  'TARGET_DELETED',
  //the published or draft revision does not match our local
  //current implementation is not particularly concerned by this, since it always createsIfNotExists
  'MISMATCHED_REVISION',
] as const

type ServerStatus = (typeof serverStatuses)[number]

/*
 * these operations should be a simplified version of those in checkoutPair.ts
 * there's additional logic here for mocking server states we'd like to test
 */
const createMockOperations = (client: any, serverStatus?: ServerStatus) => {
  const successfulMutate = (mutations: any[]) =>
    client.observable.request({
      //this should change as we go to actions API
      url: '/data/mutate',
      body: {mutations},
    })
  const createIfNotExists = jest.fn((doc: any) => {
    return {
      createIfNotExists: doc,
    }
  })
  const patchFunc = jest.fn((patches: any[]) => {
    return patches.map((patchOp) => {
      return {patch: patchOp}
    })
  })

  const mutate = jest.fn((mutations: any[]) => {
    let serverResponse
    switch (serverStatus) {
      case 'TARGET_DELETED':
        serverResponse = from(
          of({
            error: {
              description: 'Mutation failed: The document with the ID "mock-id" was not found',
              items: [
                {
                  error: {
                    description: 'The document with the ID "mock-id" was not found',
                    id: 'mock-id',
                    type: 'documentNotFoundError',
                  },
                  index: 0,
                },
              ],
              type: 'mutationError',
            },
          }),
        )
        break
      default:
        successfulMutate(mutations)
    }
    return serverResponse
  })

  return {
    patch: patchFunc,
    createIfNotExists,
    mutate,
  }
}
jest.mock('../utils/isLiveEditEnabled', () => ({isLiveEditEnabled: jest.fn()}))
beforeEach(() => {
  ;(isLiveEditEnabled as jest.Mock).mockClear()
})

describe('patch', () => {
  const client = createMockSanityClient()
  describe('disabled', () => {
    it('always returns false', () => {
      expect(patch.disabled({} as unknown as OperationArgs)).toBe(false)
    })
  })

  describe('execute', () => {
    describe('live edit enabled', () => {
      ;(isLiveEditEnabled as jest.Mock).mockImplementation(
        // eslint-disable-next-line max-nested-callbacks
        () => true,
      )

      // eslint-disable-next-line max-nested-callbacks
      it('patches and commits the published document', () => {
        patch.execute(
          {
            published: createMockOperations(client),
          } as unknown as OperationArgs,
          [],
        )
      })

      // eslint-disable-next-line max-nested-callbacks
      it('handles a document deleted on the server', () => {
        patch.execute(
          {
            published: createMockOperations(client, 'TARGET_DELETED'),
          } as unknown as OperationArgs,
          [],
        )
      })
    })
  })
})

//delete both draft and published doc
//try to patch it
