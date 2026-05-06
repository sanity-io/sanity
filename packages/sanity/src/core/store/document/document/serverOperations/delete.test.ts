import {describe, expect, it} from 'vitest'

import {
  createMockDocumentOperationArgs,
  createOperationClient,
} from '../__tests__/operationTestUtils'
import {del} from './delete'

describe('delete', () => {
  describe('disabled', () => {
    it('returns NOTHING_TO_DELETE when there is no snapshot', () => {
      expect(del.disabled(createMockDocumentOperationArgs({snapshot: null}))).toBe(
        'NOTHING_TO_DELETE',
      )
    })

    it('is enabled when a snapshot exists', () => {
      expect(del.disabled(createMockDocumentOperationArgs())).toBe(false)
    })
  })

  describe('execute', () => {
    it('discards versions when there is no published document', () => {
      const client = createOperationClient()

      del.execute(
        createMockDocumentOperationArgs({
          client,
          publishedId: undefined,
        }),
        ['versions.release-id.example-id', 'versions.other.example-id'],
      )

      expect(client.$log.observable.action[0]).toEqual({
        actions: [
          {
            actionType: 'sanity.action.document.version.discard',
            versionId: 'versions.release-id.example-id',
          },
          {
            actionType: 'sanity.action.document.version.discard',
            versionId: 'versions.other.example-id',
          },
        ],
        options: {skipCrossDatasetReferenceValidation: true},
      })
    })

    it('uses an empty version discard list when no published document or versions exist', () => {
      const client = createOperationClient()

      del.execute(
        createMockDocumentOperationArgs({
          client,
          publishedId: undefined,
        }),
      )

      expect(client.$log.observable.action[0]).toEqual({
        actions: [],
        options: {skipCrossDatasetReferenceValidation: true},
      })
    })

    it('deletes the published document and filters published ids out of includeDrafts', () => {
      const client = createOperationClient()

      del.execute(createMockDocumentOperationArgs({client}), [
        'example-id',
        'drafts.example-id',
        'versions.release-id.example-id',
      ])

      expect(client.$log.observable.action[0]).toEqual({
        actions: {
          actionType: 'sanity.action.document.delete',
          includeDrafts: ['drafts.example-id', 'versions.release-id.example-id'],
          publishedId: 'example-id',
        },
        options: {
          tag: 'document.delete',
          skipCrossDatasetReferenceValidation: true,
        },
      })
    })

    it('falls back to the draft id when deleting without explicit versions', () => {
      const client = createOperationClient()

      del.execute(createMockDocumentOperationArgs({client}))

      expect(client.$log.observable.action[0].actions).toEqual({
        actionType: 'sanity.action.document.delete',
        includeDrafts: ['drafts.example-id'],
        publishedId: 'example-id',
      })
    })

    it('uses an empty includeDrafts list when no versions or draft id are available', () => {
      const client = createOperationClient()

      del.execute(
        createMockDocumentOperationArgs({
          client,
          draftId: undefined,
        }),
      )

      expect(client.$log.observable.action[0].actions).toEqual({
        actionType: 'sanity.action.document.delete',
        includeDrafts: [],
        publishedId: 'example-id',
      })
    })
  })
})
