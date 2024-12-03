import {type Mock, type Mocked, vi} from 'vitest'

import {LATEST} from '../../../util/const'
import {type PerspectiveValue, usePerspective} from '../../usePerspective'

export const usePerspectiveMockReturn: Mocked<PerspectiveValue> = {
  selectedPerspectiveName: undefined,
  excludedPerspectives: [],
  setPerspective: vi.fn(),
  selectedPerspective: LATEST,
  setPerspectiveFromReleaseId: vi.fn(),
  setPerspectiveFromReleaseDocumentId: vi.fn(),
  toggleExcludedPerspective: vi.fn(),
  isPerspectiveExcluded: vi.fn(),
  globalReleaseDocumentId: 'drafts',
  perspectiveStack: [],
}

export const mockUsePerspective = usePerspective as Mock<typeof usePerspective>
