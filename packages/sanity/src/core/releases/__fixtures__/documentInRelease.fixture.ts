import {type DocumentInRelease} from '../tool/detail/types'

/**
 * Builds a static `DocumentInRelease` row. Shared by the release document
 * action unit tests and the release-detail Chromatic sentinels so the two
 * cannot drift apart.
 */
export function createMockDocument(
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
