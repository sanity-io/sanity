import {describe, expect, it} from 'vitest'

import {
  createMockDocumentOperationArgs,
  createMockSchema,
  createOperationClient,
  createSnapshot,
} from '../__tests__/operationTestUtils'
import {publish} from './publish'

describe('publish', () => {
  describe('disabled', () => {
    it('returns LIVE_EDIT_ENABLED when live edit is enabled', () => {
      expect(
        publish.disabled(
          createMockDocumentOperationArgs({schema: createMockSchema({liveEdit: true})}),
        ),
      ).toBe('LIVE_EDIT_ENABLED')
    })

    it('returns ALREADY_PUBLISHED when there is no snapshot but a published document exists', () => {
      expect(publish.disabled(createMockDocumentOperationArgs({snapshot: null}))).toBe(
        'ALREADY_PUBLISHED',
      )
    })

    it('returns NO_CHANGES when there is no snapshot or published document', () => {
      expect(
        publish.disabled(createMockDocumentOperationArgs({publishedId: undefined, snapshot: null})),
      ).toBe('NO_CHANGES')
    })

    it('is enabled for draft documents', () => {
      expect(
        publish.disabled(
          createMockDocumentOperationArgs({snapshot: createSnapshot({_id: 'drafts.example-id'})}),
        ),
      ).toBe(false)
    })

    it('is enabled for version documents', () => {
      expect(
        publish.disabled(
          createMockDocumentOperationArgs({
            snapshot: createSnapshot({_id: 'versions.release-id.example-id'}),
          }),
        ),
      ).toBe(false)
    })

    it('returns VERSION_CANT_BE_PUBLISHED for published documents', () => {
      expect(
        publish.disabled(
          createMockDocumentOperationArgs({snapshot: createSnapshot({_id: 'example-id'})}),
        ),
      ).toBe('VERSION_CANT_BE_PUBLISHED')
    })
  })

  describe('execute', () => {
    it('throws when there is no snapshot', () => {
      expect(() => publish.execute(createMockDocumentOperationArgs({snapshot: null}))).toThrow(
        'cannot execute "publish" when snapshot is missing',
      )
    })

    it('throws when the snapshot is not a draft or version document', () => {
      expect(() =>
        publish.execute(
          createMockDocumentOperationArgs({snapshot: createSnapshot({_id: 'example-id'})}),
        ),
      ).toThrow('cannot execute "publish" when snapshot is not a draft')
    })

    it('publishes draft documents', () => {
      const client = createOperationClient()

      publish.execute(
        createMockDocumentOperationArgs({
          client,
          snapshot: createSnapshot({_id: 'drafts.example-id'}),
        }),
      )

      expect(client.$log.observable.action[0]).toEqual({
        actions: {
          actionType: 'sanity.action.document.publish',
          draftId: 'drafts.example-id',
          publishedId: 'example-id',
        },
        options: {tag: 'document.publish'},
      })
    })

    it('publishes version documents', () => {
      const client = createOperationClient()

      publish.execute(
        createMockDocumentOperationArgs({
          client,
          snapshot: createSnapshot({_id: 'versions.release-id.example-id'}),
        }),
      )

      expect(client.$log.observable.action[0].actions).toEqual({
        actionType: 'sanity.action.document.publish',
        draftId: 'versions.release-id.example-id',
        publishedId: 'example-id',
      })
    })
  })
})
