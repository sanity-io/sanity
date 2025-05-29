import {type Mock, vi} from 'vitest'

import {type DocumentInRelease} from '../useBundleDocuments'

export const documentsInRelease: DocumentInRelease = {
  memoKey: 'a',
  document: {
    _id: 'a',
    _createdAt: '2023-10-01T08:00:00Z',
    _updatedAt: '2023-10-01T09:00:00Z',
    _rev: 'a',
    _type: 'document',
    publishedDocumentExists: true,
  },
  validation: {
    hasError: false,
    validation: [],
    isValidating: false,
  },
  previewValues: {
    isLoading: false,
    values: {},
  },
}

export const useBundleDocumentsMockReturn = {
  loading: false,
  results: [],
  error: null,
}

export const useBundleDocumentsMockReturnWithResults = {
  loading: false,
  results: [documentsInRelease],
  error: null,
}

export const useBundleDocuments = vi.fn(() => useBundleDocumentsMockReturn) as Mock<() => typeof useBundleDocumentsMockReturn> 