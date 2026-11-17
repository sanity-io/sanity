import {type Mock, type Mocked} from 'vitest'

import {type PerspectiveContextValue} from '../types'
import {usePerspective} from '../usePerspective'

export const perspectiveContextValueMock: Mocked<PerspectiveContextValue> = {
  selectedPerspectiveName: undefined,
  selectedReleaseId: undefined,
  selectedPerspective: 'drafts',
  perspectiveStack: ['drafts'],
  excludedPerspectives: [],
  selectedVariantNames: [],
  selectedVariants: [],
  // oxlint-disable-next-line typescript/no-deprecated -- mock still fills the deprecated single-variant fields
  selectedVariantName: undefined,
  // oxlint-disable-next-line typescript/no-deprecated -- mock still fills the deprecated single-variant fields
  selectedVariant: undefined,
  bundle: 'drafts',
}
export const usePerspectiveMockReturn = perspectiveContextValueMock

export const mockUsePerspective = usePerspective as Mock<typeof usePerspective>
