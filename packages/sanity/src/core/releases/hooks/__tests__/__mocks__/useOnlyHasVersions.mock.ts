import {type Mock, type Mocked} from 'vitest'

import {useOnlyHasVersions} from '../../useOnlyHasVersions'

export const useOnlyHasVersionsReturn: Mocked<{onlyHasVersions: boolean}> = {
  onlyHasVersions: false,
}

export const mockUseOnlyHasVersions = useOnlyHasVersions as Mock<typeof useOnlyHasVersions>
