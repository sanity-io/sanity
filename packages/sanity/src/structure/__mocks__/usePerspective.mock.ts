import {type Mock} from 'vitest'

export const usePerspectiveMockReturn = {
  selectedPerspectiveName: undefined,
  selectedReleaseId: undefined,
  selectedPerspective: 'drafts' as const,
  perspectiveStack: ['drafts' as const],
  excludedPerspectives: [],
}

export type MockUsePerspective = Mock<() => typeof usePerspectiveMockReturn>