import {type Mock, vi} from 'vitest'

export const useArchivedReleasesMockReturn = {
  data: [],
  error: undefined,
  loading: false,
}

export const useArchivedReleases = vi.fn(() => useArchivedReleasesMockReturn) as Mock<() => typeof useArchivedReleasesMockReturn> 