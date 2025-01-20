import {type Mock, type Mocked} from 'vitest'

import {type PerspectiveStackValue, usePerspectiveStack} from '../../usePerspectiveStack'

export const usePerspectiveMockReturn: Mocked<PerspectiveStackValue> = {
  perspectiveStack: [],
}

export const mockUsePerspective = usePerspectiveStack as Mock<typeof usePerspectiveStack>
