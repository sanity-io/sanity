import {type ReleaseDocument} from '@sanity/client'
import {type Mock, vi} from 'vitest'

export const useActiveReleasesMockReturn = {
  data: [] as ReleaseDocument[],
  error: undefined as Error | undefined,
  loading: false,
  dispatch: vi.fn(),
}

export const useActiveReleases = vi.fn(() => useActiveReleasesMockReturn) as Mock<() => typeof useActiveReleasesMockReturn> 