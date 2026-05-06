import {describe, expect, it} from 'vitest'

import {
  createMockDocumentOperationArgs,
  createOperationClient,
} from '../__tests__/operationTestUtils'
import {discardChanges} from './discardChanges'

describe('discardChanges', () => {
  describe('disabled', () => {
    it('returns NO_CHANGES when there is no snapshot', () => {
      expect(discardChanges.disabled(createMockDocumentOperationArgs({snapshot: null}))).toBe(
        'NO_CHANGES',
      )
    })

    it('is enabled when a snapshot exists', () => {
      expect(discardChanges.disabled(createMockDocumentOperationArgs())).toBe(false)
    })
  })

  describe('execute', () => {
    it('throws when there is no snapshot', () => {
      expect(() =>
        discardChanges.execute(createMockDocumentOperationArgs({snapshot: null})),
      ).toThrow('Cannot discard changes on empty document')
    })

    it('runs the discard action for the current draft', () => {
      const client = createOperationClient()

      discardChanges.execute(createMockDocumentOperationArgs({client}))

      expect(client.$log.observable.action[0]).toEqual({
        actions: {
          actionType: 'sanity.action.document.discard',
          draftId: 'drafts.example-id',
        },
        options: {tag: 'document.discard-changes'},
      })
    })
  })
})
