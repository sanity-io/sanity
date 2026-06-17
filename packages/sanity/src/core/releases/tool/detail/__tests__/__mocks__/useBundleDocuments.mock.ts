import {type Mock, type Mocked} from 'vitest'

import {type DocumentInBundle} from '../../useBundleDocuments'
import {useReleaseDocuments} from '../../useReleaseDocuments'

export const documentsInRelease: DocumentInBundle = {
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

export const useBundleDocumentsMockReturn: Mocked<ReturnType<typeof useReleaseDocuments>> = {
  loading: false,
  results: [],
  error: null,
}

export const useBundleDocumentsMockReturnWithResults: Mocked<
  ReturnType<typeof useReleaseDocuments>
> = {
  loading: false,
  results: [documentsInRelease],
  error: null,
}

export const mockUseBundleDocuments = useReleaseDocuments as Mock<typeof useReleaseDocuments>
