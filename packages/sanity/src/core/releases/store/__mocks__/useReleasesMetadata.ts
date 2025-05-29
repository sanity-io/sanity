import {type Mock, vi} from 'vitest'

export const useReleasesMetadataMockReturn = {
  data: null,
  error: null,
  loading: false,
}

export const useReleasesMetadata = vi.fn(() => useReleasesMetadataMockReturn) as Mock<() => typeof useReleasesMetadataMockReturn> 