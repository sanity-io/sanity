import {type Mock, type Mocked} from 'vitest'

import {useOnlyHasVersions, type useOnlyHasVersionsState} from '../../useOnlyHasVersions'

export const useOnlyHasVersionsReturn: Mocked<useOnlyHasVersionsState> = {
  onlyHasVersions: false,
}

export const mockUseOnlyHasVersions = useOnlyHasVersions as Mock<typeof useOnlyHasVersions>
