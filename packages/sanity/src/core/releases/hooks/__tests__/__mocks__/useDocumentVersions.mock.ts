import {type Mock, type Mocked} from 'vitest'

import {type DocumentPerspectiveState, useDocumentVersions} from '../../useDocumentVersions'

export const useDocumentVersionsReturn: Mocked<DocumentPerspectiveState> = {
  data: [],
  versions: [],
  error: null,
  loading: true,
}

export const mockUseDocumentVersions = useDocumentVersions as Mock<typeof useDocumentVersions>
