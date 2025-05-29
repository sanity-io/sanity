import {type Mock, vi} from 'vitest'

export const useAllReleasesMockReturn = {
  data: [],
  error: undefined,
  loading: false,
}

export const useAllReleases = vi.fn(() => useAllReleasesMockReturn) as Mock<() => typeof useAllReleasesMockReturn> 