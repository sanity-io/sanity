import {type Mock, type Mocked} from 'vitest'

import {
  type DocumentIdStack,
  useDocumentIdStack as useDocumentIdStackFn,
} from '../../useDocumentIdStack'

export const useDocumentIdStackMockReturn: Mocked<DocumentIdStack> = {
  position: 0,
  previousId: undefined,
  nextId: undefined,
  stack: [],
}

export const mockUseDocumentIdStack = useDocumentIdStackFn as unknown as Mock<
  typeof useDocumentIdStackFn
>
