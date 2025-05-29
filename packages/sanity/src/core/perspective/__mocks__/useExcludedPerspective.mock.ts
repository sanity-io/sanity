import {type Mock, type Mocked, vi} from 'vitest'

import {type ExcludedPerspectiveValue} from '../useExcludedPerspective'

export const useExcludedPerspectiveMockReturn: Mocked<ExcludedPerspectiveValue> = {
  excludedPerspectives: [],
  toggleExcludedPerspective: vi.fn(),
  isPerspectiveExcluded: vi.fn().mockReturnValue(false),
}

export const useExcludedPerspective = vi.fn(() => useExcludedPerspectiveMockReturn) as Mock<() => ExcludedPerspectiveValue>
