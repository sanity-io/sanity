import {type Mock} from 'vitest'

import {type UseDocumentTitle, useDocumentTitle} from '../useDocumentTitle'

export const useDocumentTitleMockReturn: UseDocumentTitle = {
  title: 'Test Title',
  error: undefined,
}

export const mockUseDocumentTitle = useDocumentTitle as Mock<typeof useDocumentTitle>
