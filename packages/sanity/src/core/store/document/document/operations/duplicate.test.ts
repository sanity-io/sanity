import {describe, expect, it, vi} from 'vitest'

import {
  createMockDocumentOperationArgs,
  createOperationClient,
  createSnapshot,
  draftTarget,
  publishedTarget,
  releaseTarget,
} from '../__tests__/operationTestUtils'
import {duplicate} from './duplicate'

describe('duplicate', () => {
  describe('disabled', () => {
    it('returns NOTHING_TO_DUPLICATE when there is no snapshot', () => {
      expect(duplicate.disabled(createMockDocumentOperationArgs({snapshot: null}))).toBe(
        'NOTHING_TO_DUPLICATE',
      )
    })

    it('is enabled when a snapshot exists', () => {
      expect(duplicate.disabled(createMockDocumentOperationArgs())).toBe(false)
    })
  })

  describe('execute', () => {
    it('throws when there is no snapshot', () => {
      expect(() =>
        duplicate.execute(createMockDocumentOperationArgs({snapshot: null}), 'copy-id'),
      ).toThrow('cannot execute duplicate on empty document')
    })

    it('creates a draft duplicate for draft targets', () => {
      const client = createOperationClient()
      const args = createMockDocumentOperationArgs({
        client,
        target: draftTarget,
      })

      duplicate.execute(args, 'copy-id')

      expect(client.$log.observable.create[0]).toEqual([
        expect.objectContaining({_id: 'drafts.copy-id', _type: 'movie', title: 'Alien'}),
        {tag: 'document.duplicate'},
      ])
    })

    it('creates a published duplicate for published targets', () => {
      const client = createOperationClient()
      const args = createMockDocumentOperationArgs({
        client,
        target: publishedTarget,
      })

      duplicate.execute(args, 'copy-id')

      expect(client.$log.observable.create[0][0]).toEqual(expect.objectContaining({_id: 'copy-id'}))
    })

    it('creates a version duplicate for release targets', () => {
      const client = createOperationClient()
      const args = createMockDocumentOperationArgs({
        client,
        target: releaseTarget,
      })

      duplicate.execute(args, 'copy-id')

      expect(client.$log.observable.create[0][0]).toEqual(
        expect.objectContaining({_id: 'versions.release-id.copy-id'}),
      )
    })

    it('omits timestamp fields from the created document', () => {
      const client = createOperationClient()
      const args = createMockDocumentOperationArgs({client})

      duplicate.execute(args, 'copy-id')

      expect(client.$log.observable.create[0][0]).not.toHaveProperty('_createdAt')
      expect(client.$log.observable.create[0][0]).not.toHaveProperty('_updatedAt')
    })

    it('applies mapDocument before creating the duplicate', () => {
      const client = createOperationClient()
      const mapDocument = vi.fn((document) => ({
        ...document,
        title: 'Mapped title',
        extra: true,
      }))
      const snapshot = createSnapshot({title: 'Original title'})
      const args = createMockDocumentOperationArgs({
        client,
        snapshot,
      })

      duplicate.execute(args, 'copy-id', {mapDocument})

      expect(mapDocument).toHaveBeenCalledWith(
        expect.objectContaining({_id: 'drafts.copy-id', title: 'Original title'}),
      )
      expect(client.$log.observable.create[0][0]).toEqual(
        expect.objectContaining({title: 'Mapped title', extra: true}),
      )
    })
  })
})
