import {type Mocked} from 'vitest'

import {type DocumentInRelease, type useBundleDocuments} from '../../useBundleDocuments'

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

export const useBundleDocumentsMock: Mocked<ReturnType<typeof useBundleDocuments>> = {
  loading: false,
  results: [documentsInRelease],
}
