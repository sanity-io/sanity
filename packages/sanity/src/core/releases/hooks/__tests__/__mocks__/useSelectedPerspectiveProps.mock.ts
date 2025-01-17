import {type Mock, type Mocked} from 'vitest'

import {
  type SelectedPerspectivePropsValue,
  useSelectedPerspectiveProps,
} from '../../useSelectedPerspectiveProps'

export const useSelectedPerspectivePropsMockReturn: Mocked<SelectedPerspectivePropsValue> = {
  selectedPerspectiveName: undefined,
  selectedReleaseId: undefined,
}

export const mockUseSelectedPerspectiveProps = useSelectedPerspectiveProps as Mock<
  typeof useSelectedPerspectiveProps
>
