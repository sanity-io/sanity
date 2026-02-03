import {type UseDocumentTitle, useDocumentTitle} from '../useDocumentTitle'
import {type Mock} from 'vitest'

export const useDocumentTitleMockReturn: UseDocumentTitle = {
  title: 'Test Title',
  error: undefined,
}

export const mockUseDocumentTitle = useDocumentTitle as Mock<typeof useDocumentTitle>
