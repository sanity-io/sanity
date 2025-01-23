import {type Mock, type Mocked, vi} from 'vitest'

import {type ExcludedPerspectiveValue, useExcludedPerspective} from '../useExcludedPerspective'

export const useExcludedPerspectiveMockReturn: Mocked<ExcludedPerspectiveValue> = {
  excludedPerspectives: [],
  toggleExcludedPerspective: vi.fn(),
  isPerspectiveExcluded: vi.fn().mockReturnValue(false),
}

export const mockUseExcludedPerspective = useExcludedPerspective as Mock<
  typeof useExcludedPerspective
>
