import {type Mock, type Mocked} from 'vitest'

// @ts-expect-error -- Pre-existing type error, test file recently added to CI type checking
import {useOnlyHasVersions, type useOnlyHasVersionsState} from '../../useOnlyHasVersions'

export const useOnlyHasVersionsReturn: Mocked<useOnlyHasVersionsState> = {
  onlyHasVersions: false,
}

export const mockUseOnlyHasVersions = useOnlyHasVersions as Mock<typeof useOnlyHasVersions>
