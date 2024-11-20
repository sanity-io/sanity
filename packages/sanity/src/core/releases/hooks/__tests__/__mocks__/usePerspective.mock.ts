import {type Mock, type Mocked, vi} from 'vitest'

import {LATEST} from '../../../util/const'
import {type PerspectiveValue, usePerspective} from '../../usePerspective'

export const usePerspectiveMockReturn: Mocked<PerspectiveValue> = {
  perspective: undefined,
  excludedPerspectives: [],
  setPerspective: vi.fn(),
  currentGlobalBundle: LATEST,
  setPerspectiveFromReleaseId: vi.fn(),
  setPerspectiveFromReleaseDocumentId: vi.fn(),
  toggleExcludedPerspective: vi.fn(),
  isPerspectiveExcluded: vi.fn(),
  currentGlobalBundleId: 'drafts',
  bundlesPerspective: [],
}

export const mockUsePerspective = usePerspective as Mock<typeof usePerspective>
