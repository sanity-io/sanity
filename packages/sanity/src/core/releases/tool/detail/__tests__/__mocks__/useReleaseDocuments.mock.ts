import {type Mock, type Mocked} from 'vitest'

import {useReleaseDocuments} from '../../useReleaseDocuments'
import {documentsInRelease} from './useBundleDocuments.mock'

export const useReleaseDocumentsMockReturn: Mocked<ReturnType<typeof useReleaseDocuments>> = {
  loading: false,
  results: [],
  error: null,
}

export const useReleaseDocumentsMockReturnWithResults: Mocked<
  ReturnType<typeof useReleaseDocuments>
> = {
  loading: false,
  results: [documentsInRelease],
  error: null,
}

export const mockUseReleaseDocuments = useReleaseDocuments as Mock<typeof useReleaseDocuments>
