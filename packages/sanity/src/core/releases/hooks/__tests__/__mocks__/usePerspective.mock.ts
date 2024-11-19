import {type Mocked, vi} from 'vitest'

import {LATEST} from '../../../util/const'
import {type PerspectiveValue} from '../../usePerspective'

export const usePerspectiveMock: Mocked<PerspectiveValue> = {
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
