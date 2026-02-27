import {describe, expect, it} from 'vitest'

import {
  countDocumentsByAction,
  type DocumentFilterType,
  documentMatchesFilter,
} from '../releaseDocumentActions'
import {type DocumentInRelease} from '../useBundleDocuments'

function createMockDocument(
  overrides: Partial<{
    isPending: boolean
    hasError: boolean
    publishedDocumentExists: boolean
    systemDelete: boolean
  }> = {},
): DocumentInRelease {
  const {
    isPending = false,
    hasError = false,
    publishedDocumentExists = false,
    systemDelete = false,
  } = overrides

  return {
    memoKey: 'test-key',
    isPending,
    document: {
      _id: 'test-id',
      _type: 'test-type',
      _rev: 'test-rev',
      _createdAt: '2024-01-01T00:00:00.000Z',
      _updatedAt: '2024-01-01T00:00:00.000Z',
      publishedDocumentExists,
      ...(systemDelete ? {_system: {delete: true}} : {}),
    },
    validation: {
      hasError,
      isValidating: false,
      validation: [],
    },
  }
}

describe('releaseDocumentActions', () => {
  describe('countDocumentsByAction', () => {
    it('counts documents by action type correctly', () => {
      const documents = [
        createMockDocument({publishedDocumentExists: false}), // added
        createMockDocument({publishedDocumentExists: false}), // added
        createMockDocument({publishedDocumentExists: true}), // changed
        createMockDocument({systemDelete: true, publishedDocumentExists: true}), // unpublished
      ]

      const counts = countDocumentsByAction(documents)

      expect(counts.added).toBe(2)
      expect(counts.changed).toBe(1)
      expect(counts.unpublished).toBe(1)
      expect(counts.errors).toBe(0)
    })

    it('counts documents with validation errors', () => {
      const documents = [
        createMockDocument({hasError: true}),
        createMockDocument({hasError: true}),
        createMockDocument({hasError: false}),
      ]

      const counts = countDocumentsByAction(documents)

      expect(counts.errors).toBe(2)
    })

    it('handles documents that match multiple categories (action + error)', () => {
      const documents = [
        createMockDocument({publishedDocumentExists: false, hasError: true}), // added + error
        createMockDocument({publishedDocumentExists: true, hasError: true}), // changed + error
      ]

      const counts = countDocumentsByAction(documents)

      expect(counts.added).toBe(1)
      expect(counts.changed).toBe(1)
      expect(counts.errors).toBe(2)
    })

    it('returns zero counts for empty array', () => {
      const counts = countDocumentsByAction([])

      expect(counts.added).toBe(0)
      expect(counts.changed).toBe(0)
      expect(counts.unpublished).toBe(0)
      expect(counts.errors).toBe(0)
    })

    it('ignores pending documents in action counts', () => {
      const documents = [
        createMockDocument({isPending: true, publishedDocumentExists: false}),
        createMockDocument({isPending: true, publishedDocumentExists: true}),
        createMockDocument({isPending: false, publishedDocumentExists: false}), // only this counts as added
      ]

      const counts = countDocumentsByAction(documents)

      expect(counts.added).toBe(1)
      expect(counts.changed).toBe(0)
      expect(counts.unpublished).toBe(0)
    })
  })

  describe('documentMatchesFilter', () => {
    it('returns true for all documents when filter is "all"', () => {
      const documents = [
        createMockDocument({publishedDocumentExists: false}),
        createMockDocument({publishedDocumentExists: true}),
        createMockDocument({systemDelete: true}),
        createMockDocument({hasError: true}),
        createMockDocument({isPending: true}),
      ]

      const filter: DocumentFilterType = 'all'
      const results = documents.map((doc) => documentMatchesFilter(doc, filter))

      expect(results.every(Boolean)).toBe(true)
    })

    it('returns true for documents with errors when filter is "errors"', () => {
      const docWithError = createMockDocument({hasError: true})
      const docWithoutError = createMockDocument({hasError: false})

      expect(documentMatchesFilter(docWithError, 'errors')).toBe(true)
      expect(documentMatchesFilter(docWithoutError, 'errors')).toBe(false)
    })

    it('returns true for added documents when filter is "added"', () => {
      const addedDoc = createMockDocument({publishedDocumentExists: false})
      const changedDoc = createMockDocument({publishedDocumentExists: true})

      expect(documentMatchesFilter(addedDoc, 'added')).toBe(true)
      expect(documentMatchesFilter(changedDoc, 'added')).toBe(false)
    })

    it('returns true for changed documents when filter is "changed"', () => {
      const changedDoc = createMockDocument({publishedDocumentExists: true})
      const addedDoc = createMockDocument({publishedDocumentExists: false})

      expect(documentMatchesFilter(changedDoc, 'changed')).toBe(true)
      expect(documentMatchesFilter(addedDoc, 'changed')).toBe(false)
    })

    it('returns true for unpublished documents when filter is "unpublished"', () => {
      const unpublishedDoc = createMockDocument({systemDelete: true, publishedDocumentExists: true})
      const changedDoc = createMockDocument({publishedDocumentExists: true})

      expect(documentMatchesFilter(unpublishedDoc, 'unpublished')).toBe(true)
      expect(documentMatchesFilter(changedDoc, 'unpublished')).toBe(false)
    })

    it('returns false when document does not match filter', () => {
      const addedDoc = createMockDocument({publishedDocumentExists: false})

      expect(documentMatchesFilter(addedDoc, 'changed')).toBe(false)
      expect(documentMatchesFilter(addedDoc, 'unpublished')).toBe(false)
      expect(documentMatchesFilter(addedDoc, 'errors')).toBe(false)
    })
  })
})
