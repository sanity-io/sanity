import {type Mock, type Mocked, vi} from 'vitest'

import {type PerspectiveContextValue} from '../../../../perspective/types'
import {usePerspective} from '../../../../perspective/usePerspective'

export const perspectiveContextValueMock: Mocked<PerspectiveContextValue> = {
  selectedPerspectiveName: undefined,
  selectedReleaseId: undefined,
  selectedPerspective: 'drafts',
  toggleExcludedPerspective: vi.fn(),
  isPerspectiveExcluded: vi.fn(),
  perspectiveStack: [],
}
export const usePerspectiveMockReturn = perspectiveContextValueMock

export const mockUsePerspective = usePerspective as Mock<typeof usePerspective>
