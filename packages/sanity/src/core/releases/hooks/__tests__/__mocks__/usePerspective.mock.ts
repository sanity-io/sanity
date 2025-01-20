import {type Mock, type Mocked, vi} from 'vitest'

import {type PerspectiveContextValue} from '../../../../perspective/types'
import {usePerspective} from '../../../../perspective/usePerspective'

export const usePerspectiveMockReturn: Mocked<PerspectiveContextValue> = {
  selectedPerspectiveName: undefined,
  selectedReleaseId: undefined,
  setPerspective: vi.fn(),
  selectedPerspective: 'drafts',
  toggleExcludedPerspective: vi.fn(),
  isPerspectiveExcluded: vi.fn(),
  perspectiveStack: [],
}

export const mockUsePerspective = usePerspective as Mock<typeof usePerspective>
