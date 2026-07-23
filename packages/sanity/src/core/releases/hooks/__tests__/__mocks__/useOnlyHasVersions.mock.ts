import {type Mock, type Mocked} from 'vitest'

// @ts-expect-error -- pre-existing; now gated by oxlint options.typeCheck
import {useOnlyHasVersions, type useOnlyHasVersionsState} from '../../useOnlyHasVersions'

export const useOnlyHasVersionsReturn: Mocked<useOnlyHasVersionsState> = {
  onlyHasVersions: false,
}

export const mockUseOnlyHasVersions = useOnlyHasVersions as Mock<typeof useOnlyHasVersions>
