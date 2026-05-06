import {firstValueFrom} from 'rxjs'
import {describe, expect, it} from 'vitest'

import {
  createMockDocumentOperationArgs,
  createOperationClient,
  createSnapshot,
} from '../__tests__/operationTestUtils'
import {unpublish} from './unpublish'

describe('unpublish', () => {
  describe('disabled', () => {
    it('returns NOT_PUBLISHED when there is no snapshot', () => {
      expect(unpublish.disabled(createMockDocumentOperationArgs({snapshot: null}))).toBe(
        'NOT_PUBLISHED',
      )
    })

    it('returns NOT_PUBLISHED when the snapshot is not published', () => {
      expect(
        unpublish.disabled(
          createMockDocumentOperationArgs({snapshot: createSnapshot({_id: 'drafts.example-id'})}),
        ),
      ).toBe('NOT_PUBLISHED')
    })

    it('is enabled for published documents', () => {
      expect(
        unpublish.disabled(
          createMockDocumentOperationArgs({snapshot: createSnapshot({_id: 'example-id'})}),
        ),
      ).toBe(false)
    })
  })

  describe('execute', () => {
    it('throws when publishedId is not provided', () => {
      expect(() =>
        unpublish.execute(createMockDocumentOperationArgs({publishedId: undefined})),
      ).toThrow('cannot execute "unpublish" when publishedId is not provided')
    })

    it('unpublishes with an existing draft id', async () => {
      const client = createOperationClient()
      const result = unpublish.execute(
        createMockDocumentOperationArgs({
          client,
          snapshot: createSnapshot({_id: 'example-id'}),
        }),
      )

      await expect(firstValueFrom(result!)).resolves.toEqual({})
      expect(client.$log.observable.action[0]).toEqual({
        actions: {
          actionType: 'sanity.action.document.unpublish',
          draftId: 'drafts.example-id',
          publishedId: 'example-id',
        },
        options: {
          tag: 'document.unpublish',
          skipCrossDatasetReferenceValidation: true,
        },
      })
    })

    it('falls back to a draft id when none is provided', () => {
      const client = createOperationClient()

      unpublish.execute(
        createMockDocumentOperationArgs({
          client,
          draftId: undefined,
          snapshot: createSnapshot({_id: 'example-id'}),
        }),
      )

      expect(client.$log.observable.action[0].actions).toEqual({
        actionType: 'sanity.action.document.unpublish',
        draftId: 'drafts.example-id',
        publishedId: 'example-id',
      })
    })
  })
})
