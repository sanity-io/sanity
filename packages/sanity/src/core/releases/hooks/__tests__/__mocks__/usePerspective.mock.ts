import {type Mock, type Mocked, vi} from 'vitest'

import {type PerspectiveValue, usePerspective} from '../../usePerspective'

export const usePerspectiveMockReturn: Mocked<PerspectiveValue> = {
  setPerspective: vi.fn(),
  selectedPerspective: 'drafts',
  toggleExcludedPerspective: vi.fn(),
  isPerspectiveExcluded: vi.fn(),
  perspectiveStack: [],
}

export const mockUsePerspective = usePerspective as Mock<typeof usePerspective>
