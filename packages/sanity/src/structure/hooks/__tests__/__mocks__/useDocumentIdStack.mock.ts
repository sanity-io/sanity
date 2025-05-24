import {type Mock, type Mocked} from 'vitest'

import {type useDocumentIdStack as useDocumentIdStackFn} from '../../useDocumentIdStack'

export const useDocumentIdStackMockReturn: Mocked<ReturnType<typeof useDocumentIdStackFn>> = {
  position: -1,
  stack: [],
  previousId: undefined,
  nextId: undefined,
}

export const mockUseDocumentIdStack = useDocumentIdStackFn as Mock<typeof useDocumentIdStackFn>
