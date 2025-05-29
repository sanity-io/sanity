import {type Mock, vi} from 'vitest'

import {type PerspectiveContextValue} from '../types'

export const perspectiveContextValueMock: PerspectiveContextValue = {
  selectedPerspectiveName: undefined,
  selectedReleaseId: undefined,
  selectedPerspective: 'drafts',
  perspectiveStack: ['drafts'],
  excludedPerspectives: [],
}

export const usePerspectiveMockReturn = perspectiveContextValueMock

export const usePerspective = vi.fn(() => usePerspectiveMockReturn) as Mock<() => PerspectiveContextValue> 