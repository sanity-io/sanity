import {type Mock, type Mocked} from 'vitest'

import {type DocumentInRelease, useBundleDocuments} from '../../useBundleDocuments'

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
}

export const useBundleDocumentsMockReturn: Mocked<ReturnType<typeof useBundleDocuments>> = {
  loading: false,
  results: [],
  error: null,
}

export const useBundleDocumentsMockReturnWithResults: Mocked<
  ReturnType<typeof useBundleDocuments>
> = {
  loading: false,
  results: [documentsInRelease],
  error: null,
}

export const mockUseBundleDocuments = useBundleDocuments as Mock<typeof useBundleDocuments>
