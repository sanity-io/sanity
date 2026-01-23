import {type Mock, type Mocked} from 'vitest'

// @ts-expect-error -- Legacy test code, will be fixed separately
import {useOnlyHasVersions, type useOnlyHasVersionsState} from '../../useOnlyHasVersions'

export const useOnlyHasVersionsReturn: Mocked<useOnlyHasVersionsState> = {
  onlyHasVersions: false,
}

export const mockUseOnlyHasVersions = useOnlyHasVersions as Mock<typeof useOnlyHasVersions>
