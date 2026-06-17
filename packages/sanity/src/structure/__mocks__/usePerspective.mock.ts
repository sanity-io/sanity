import {type PerspectiveContextValue, usePerspective} from 'sanity'
import {type Mock, type Mocked} from 'vitest'

export const perspectiveContextValueMock: Mocked<PerspectiveContextValue> = {
  selectedPerspectiveName: undefined,
  selectedReleaseId: undefined,
  selectedPerspective: 'drafts',
  perspectiveStack: ['drafts'],
  excludedPerspectives: [],
  selectedVariant: undefined,
  bundle: 'drafts',
}
export const usePerspectiveMockReturn = perspectiveContextValueMock

export const mockUsePerspective = usePerspective as Mock<typeof usePerspective>
