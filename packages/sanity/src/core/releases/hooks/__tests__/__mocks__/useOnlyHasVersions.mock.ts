import {type Mock, type Mocked} from 'vitest'

// @ts-expect-error -- pre-existing, fix later
import {useOnlyHasVersions, type useOnlyHasVersionsState} from '../../useOnlyHasVersions'

export const useOnlyHasVersionsReturn: Mocked<useOnlyHasVersionsState> = {
  onlyHasVersions: false,
}

export const mockUseOnlyHasVersions = useOnlyHasVersions as Mock<typeof useOnlyHasVersions>
