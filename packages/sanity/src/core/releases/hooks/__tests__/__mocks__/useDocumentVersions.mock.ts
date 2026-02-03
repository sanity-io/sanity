import {type DocumentPerspectiveState, useDocumentVersions} from '../../useDocumentVersions'
import {type Mock, type Mocked} from 'vitest'

export const useDocumentVersionsReturn: Mocked<DocumentPerspectiveState> = {
  data: [],
  error: null,
  loading: true,
}

export const mockUseDocumentVersions = useDocumentVersions as Mock<typeof useDocumentVersions>
