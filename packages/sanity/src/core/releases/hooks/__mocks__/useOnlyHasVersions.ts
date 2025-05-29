import {type Mock, vi} from 'vitest'

import {type useOnlyHasVersionsState} from '../useOnlyHasVersions'

export const useOnlyHasVersionsReturn: useOnlyHasVersionsState = {
  onlyHasVersions: false,
}

export const useOnlyHasVersions = vi.fn(() => useOnlyHasVersionsReturn) as Mock<() => useOnlyHasVersionsState> 