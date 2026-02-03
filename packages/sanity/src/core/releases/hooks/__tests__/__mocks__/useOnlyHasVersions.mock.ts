import {useOnlyHasVersions, type useOnlyHasVersionsState} from '../../useOnlyHasVersions'
import {type Mock, type Mocked} from 'vitest'

export const useOnlyHasVersionsReturn: Mocked<useOnlyHasVersionsState> = {
  onlyHasVersions: false,
}

export const mockUseOnlyHasVersions = useOnlyHasVersions as Mock<typeof useOnlyHasVersions>
