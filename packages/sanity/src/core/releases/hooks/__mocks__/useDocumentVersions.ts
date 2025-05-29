import {type Mock, vi} from 'vitest'

import {type DocumentPerspectiveState} from '../useDocumentVersions'

export const useDocumentVersionsReturn: DocumentPerspectiveState = {
  data: [],
  error: null,
  loading: true,
}

export const useDocumentVersions = vi.fn(() => useDocumentVersionsReturn) as Mock<() => DocumentPerspectiveState> 