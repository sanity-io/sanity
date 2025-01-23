import {type Mock, type Mocked} from 'vitest'

import {type PerspectiveContextValue} from '../types'
import {usePerspective} from '../usePerspective'

export const perspectiveContextValueMock: Mocked<PerspectiveContextValue> = {
  selectedPerspectiveName: undefined,
  selectedReleaseId: undefined,
  selectedPerspective: 'drafts',
  perspectiveStack: [],
  excludedPerspectives: [],
}
export const usePerspectiveMockReturn = perspectiveContextValueMock

export const mockUsePerspective = usePerspective as Mock<typeof usePerspective>
